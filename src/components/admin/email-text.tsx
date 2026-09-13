/**
 * Lets a long address wrap right after the @ ("name@" / "gmail.com") instead
 * of splitting the domain mid-word.
 */
export default function EmailText({ email }: { email: string }) {
  const at = email.indexOf("@");

  if (at < 0) return <>{email}</>;

  return (
    <>
      {email.slice(0, at + 1)}
      <wbr />
      {email.slice(at + 1)}
    </>
  );
}
