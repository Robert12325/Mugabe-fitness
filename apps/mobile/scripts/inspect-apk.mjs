#!/usr/bin/env node
/**
 * Reads what Android itself checks in an APK, with no Android SDK needed:
 * the package name, versionCode and versionName, the expo-updates channel
 * and runtime version, and the SHA-256 of the certificate it is signed
 * with (from the APK Signature Scheme v2/v3 block).
 *
 *   node scripts/inspect-apk.mjs app.apk
 *   node scripts/inspect-apk.mjs app.apk --release --expect-cert <sha256> [--previous <versionCode>]
 *
 * --release checks that the file can be published as the official download
 * (see RELEASING.md): the production package, the production-apk channel,
 * the expected signing certificate, and a versionCode above the previous
 * release. It then prints the entry for public/app-release/production.json.
 *
 * Android only installs an APK over an existing app when the package and
 * signing certificate match and the versionCode is not lower, so these
 * are exactly the upgrade checks.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import zlib from "node:zlib";

const PRODUCTION_PACKAGE = "com.mugabefitness.app";
const PRODUCTION_CHANNEL = "production-apk";

// ---- ZIP ---------------------------------------------------------------

function findCentralDirectory(buf) {
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65_557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      return { cdSize: buf.readUInt32LE(i + 12), cdOffset: buf.readUInt32LE(i + 16) };
    }
  }
  throw new Error("Not a ZIP/APK file (no end of central directory).");
}

function readEntry(buf, cdOffset, cdSize, wanted) {
  for (let p = cdOffset; p < cdOffset + cdSize; ) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error("Corrupt central directory.");
    const method = buf.readUInt16LE(p + 10);
    const compressedSize = buf.readUInt32LE(p + 20);
    const nameLength = buf.readUInt16LE(p + 28);
    const extraLength = buf.readUInt16LE(p + 30);
    const commentLength = buf.readUInt16LE(p + 32);
    const localOffset = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLength);

    if (name === wanted) {
      const start = localOffset + 30 + buf.readUInt16LE(localOffset + 26) + buf.readUInt16LE(localOffset + 28);
      const data = buf.subarray(start, start + compressedSize);
      if (method === 0) return data;
      if (method === 8) return zlib.inflateRawSync(data);
      throw new Error(`Unsupported compression method ${method} for ${name}.`);
    }

    p += 46 + nameLength + extraLength + commentLength;
  }
  throw new Error(`${wanted} not found in the APK.`);
}

// ---- Signing certificate (APK Signature Scheme v2 / v3) ----------------

const SIGNATURE_SCHEMES = { 0x7109871a: "v2", 0xf05368c0: "v3", 0x1b93ad61: "v3.1" };

function signingCertificates(buf, cdOffset) {
  if (buf.toString("latin1", cdOffset - 16, cdOffset) !== "APK Sig Block 42") {
    throw new Error("No APK Signing Block: the APK is unsigned or v1-only.");
  }
  const blockSize = Number(buf.readBigUInt64LE(cdOffset - 24));
  const start = cdOffset - blockSize - 8;
  const found = {};

  for (let p = start + 8; p < cdOffset - 24; ) {
    const length = Number(buf.readBigUInt64LE(p));
    const id = buf.readUInt32LE(p + 8);
    const scheme = SIGNATURE_SCHEMES[id];

    if (scheme) {
      // value: signers[] -> signer -> signedData -> (digests, certificates[])
      let q = p + 12;
      const signersEnd = q + 4 + buf.readUInt32LE(q);
      q += 4;
      const digests = [];
      while (q < signersEnd) {
        const signerLength = buf.readUInt32LE(q);
        let s = q + 4 + 4; // into signedData
        s += 4 + buf.readUInt32LE(s); // skip digests
        const certsEnd = s + 4 + buf.readUInt32LE(s);
        s += 4;
        while (s < certsEnd) {
          const certLength = buf.readUInt32LE(s);
          digests.push(crypto.createHash("sha256").update(buf.subarray(s + 4, s + 4 + certLength)).digest("hex"));
          s += 4 + certLength;
        }
        q += 4 + signerLength;
      }
      found[scheme] = digests;
    }

    p += 8 + length;
  }
  return found;
}

// ---- Binary AndroidManifest.xml ----------------------------------------

const ATTR = { name: 0x01010003, value: 0x01010024, versionCode: 0x0101021b, versionName: 0x0101021c };

function readStringPool(buf, at) {
  const headerSize = buf.readUInt16LE(at + 2);
  const count = buf.readUInt32LE(at + 8);
  const utf8 = (buf.readUInt32LE(at + 16) & (1 << 8)) !== 0;
  const stringsStart = at + buf.readUInt32LE(at + 20);
  const strings = [];

  for (let i = 0; i < count; i++) {
    let p = stringsStart + buf.readUInt32LE(at + headerSize + i * 4);
    if (utf8) {
      p += buf[p] & 0x80 ? 2 : 1; // UTF-16 length, unused
      let length = buf[p];
      if (length & 0x80) length = ((length & 0x7f) << 8) | buf[p + 1], p += 2;
      else p += 1;
      strings.push(buf.toString("utf8", p, p + length));
    } else {
      let length = buf.readUInt16LE(p);
      if (length & 0x8000) length = ((length & 0x7fff) << 16) | buf.readUInt16LE(p + 2), p += 4;
      else p += 2;
      strings.push(buf.toString("utf16le", p, p + length * 2));
    }
  }
  return strings;
}

function readManifest(xml) {
  if (xml.readUInt16LE(0) !== 0x0003) throw new Error("AndroidManifest.xml is not binary XML.");
  let strings = [];
  let resourceIds = [];
  const elements = [];

  for (let p = xml.readUInt16LE(2); p < xml.length; ) {
    const type = xml.readUInt16LE(p);
    const size = xml.readUInt32LE(p + 4);

    if (type === 0x0001) strings = readStringPool(xml, p);
    else if (type === 0x0180) {
      resourceIds = Array.from({ length: (size - 8) / 4 }, (_, i) => xml.readUInt32LE(p + 8 + i * 4));
    } else if (type === 0x0102) {
      const ext = p + 16;
      const attrStart = xml.readUInt16LE(ext + 8);
      const attrSize = xml.readUInt16LE(ext + 10);
      const attrCount = xml.readUInt16LE(ext + 12);
      const attrs = {};

      for (let i = 0; i < attrCount; i++) {
        const a = ext + attrStart + i * attrSize;
        const nameIndex = xml.readUInt32LE(a + 4);
        const raw = xml.readInt32LE(a + 8);
        const dataType = xml[a + 15];
        const data = xml.readUInt32LE(a + 16);
        const value = dataType === 0x03 ? strings[data] : raw >= 0 ? strings[raw] : data;
        const byId = Object.entries(ATTR).find(([, id]) => id === resourceIds[nameIndex])?.[0];
        attrs[byId ?? strings[nameIndex]] = value;
      }
      elements.push({ tag: strings[xml.readUInt32LE(ext + 4)], attrs });
    }
    p += size;
  }

  const manifest = elements.find((e) => e.tag === "manifest")?.attrs ?? {};
  const meta = Object.fromEntries(
    elements.filter((e) => e.tag === "meta-data").map((e) => [e.attrs.name, e.attrs.value]),
  );

  let channel = null;
  try {
    channel = JSON.parse(meta["expo.modules.updates.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY"] ?? "{}")[
      "expo-channel-name"
    ] ?? null;
  } catch {}

  return {
    package: manifest.package ?? null,
    versionCode: typeof manifest.versionCode === "number" ? manifest.versionCode : Number(manifest.versionCode),
    versionName: manifest.versionName ?? null,
    updates: {
      enabled: meta["expo.modules.updates.ENABLED"] ?? null,
      url: meta["expo.modules.updates.EXPO_UPDATE_URL"] ?? null,
      runtimeVersion: meta["expo.modules.updates.EXPO_RUNTIME_VERSION"] ?? null,
      channel,
    },
  };
}

// ---- Main --------------------------------------------------------------

function main() {
  const [file, ...rest] = process.argv.slice(2);
  if (!file) {
    console.error("Usage: inspect-apk.mjs <file.apk> [--release --expect-cert <sha256> [--previous <versionCode>]]");
    process.exit(2);
  }
  const flag = (name) => {
    const i = rest.indexOf(`--${name}`);
    return i === -1 ? undefined : rest[i + 1] ?? "";
  };

  const buf = fs.readFileSync(file);
  const { cdOffset, cdSize } = findCentralDirectory(buf);
  const info = {
    file,
    sizeBytes: buf.length,
    sha256: crypto.createHash("sha256").update(buf).digest("hex"),
    ...readManifest(readEntry(buf, cdOffset, cdSize, "AndroidManifest.xml")),
    signingCertSha256: signingCertificates(buf, cdOffset),
  };
  console.log(JSON.stringify(info, null, 2));

  if (!rest.includes("--release")) return;

  const expectedCert = flag("expect-cert")?.toLowerCase().replace(/:/g, "");
  const previous = flag("previous") === undefined ? 0 : Number(flag("previous"));
  const certs = new Set(Object.values(info.signingCertSha256).flat());
  const problems = [];

  if (info.package !== PRODUCTION_PACKAGE) problems.push(`package is ${info.package}, not ${PRODUCTION_PACKAGE}`);
  if (info.updates.channel !== PRODUCTION_CHANNEL) {
    problems.push(`update channel is ${info.updates.channel ?? "none"}, not ${PRODUCTION_CHANNEL} (a test build?)`);
  }
  if (!expectedCert || !/^[0-9a-f]{64}$/.test(expectedCert)) problems.push("give --expect-cert <sha256 of the production signing certificate>");
  else if (certs.size !== 1 || !certs.has(expectedCert)) problems.push(`signed with ${[...certs].join(", ")}, not ${expectedCert}`);
  if (!Number.isSafeInteger(info.versionCode) || info.versionCode <= previous) {
    problems.push(`versionCode ${info.versionCode} must be above the previous release (${previous})`);
  }

  if (problems.length) {
    console.error(`\n✗ Not publishable as the official download:\n  - ${problems.join("\n  - ")}`);
    process.exit(1);
  }

  console.log("\n✓ Publishable. Entry for public/app-release/production.json (android.apk.latest):");
  console.log(
    JSON.stringify(
      {
        versionName: info.versionName,
        versionCode: info.versionCode,
        applicationId: info.package,
        channel: info.updates.channel,
        url: "https://<where the APK is hosted>/mugabe-fitness-" + `${info.versionName}-${info.versionCode}.apk`,
        sha256: info.sha256,
        signingCertSha256: expectedCert,
        sizeBytes: info.sizeBytes,
        releasedAt: new Date().toISOString().slice(0, 10),
        notes: [],
      },
      null,
      2,
    ),
  );
}

try {
  main();
} catch (error) {
  console.error(`✗ ${error.message}`);
  process.exit(1);
}
