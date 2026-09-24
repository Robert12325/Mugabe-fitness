"use client";

import { useSyncExternalStore } from "react";

/**
 * English and Hindi for everything the site says in its own voice.
 *
 * What the coach types in the dashboard — program names, prices, features,
 * method steps — is shown exactly as entered and never translated here.
 *
 * The chosen language is remembered. With no choice saved, a phone set to
 * Hindi opens in Hindi.
 */

export type Lang = "en" | "hi";

const STORAGE_KEY = "mugabe-lang";

const EN = {
  "lang.switch": "Language",
  "lang.en": "EN",
  "lang.hi": "हिं",

  "nav.home": "Home",
  "nav.programs": "Programs",
  "nav.method": "Method",
  "nav.coach": "Coach",
  "nav.login": "Log in",
  "nav.account": "My account",
  "nav.start": "Start Training",
  "nav.open": "Open navigation",
  "nav.close": "Close navigation",

  "hero.become": "Become",
  "hero.stronger": "Stronger.",
  "hero.lede":
    "Personal coaching built to help you train with purpose, build strength, transform your physique, and become the strongest version of yourself.",
  "hero.cta": "Start Your Transformation",
  "hero.method": "Discover The Method",
  "hero.f1.top": "Personalized",
  "hero.f1.bottom": "Coaching",
  "hero.f2.top": "Real",
  "hero.f2.bottom": "Results",
  "hero.f3.top": "Sustainable",
  "hero.f3.bottom": "Progress",
  "hero.f4.top": "Stronger",
  "hero.f4.bottom": "You",
  "hero.photoAlt": "Your coach at Mugabe Fitness",

  "footer.explore": "Explore",
  "footer.getStarted": "Get started",
  "footer.reach": "Reach me",
  "footer.theMethod": "The Method",
  "footer.yourCoach": "Your Coach",
  "footer.howToStart": "How to start",
  "footer.book": "Book a program",
  "footer.whatsapp": "Message on WhatsApp",
  "footer.blurb":
    "Personal coaching built to help you train with purpose and become the strongest version of yourself.",
  "footer.rights": "All rights reserved.",
  "footer.motto": "Rise · Grind · Shine",
  "footer.admin": "Admin",

  "install.title": "Add Mugabe Fitness to your home screen",
  "install.ios": "Tap Share, then Add to Home Screen.",
  "install.android": "Opens full screen, like an app.",
  "install.action": "Install",
  "install.dismiss": "Not now",

  "programs.eyebrow": "Choose Your Level",
  "programs.h1": "Your training.",
  "programs.h2": "Your level.",
  "programs.lede":
    "Coaching experiences for every level. One standard of commitment. Choose the level that matches your goals and start building the body, strength, and discipline you want.",
  "programs.p1.top": "Stronger",
  "programs.p1.bottom": "Everyday",
  "programs.p2.top": "Real",
  "programs.p2.bottom": "Progress",
  "programs.p3.top": "Discipline",
  "programs.p3.bottom": "For life",
  "programs.script1": "Better",
  "programs.script2": "Stronger",
  "programs.script3": "You",
  "programs.premium": "Premium",
  "programs.slots": "Training slots",
  "programs.choose": "Choose {name}",
  "programs.loginNote": "You’ll log in or create an account first.",

  "method.eyebrow": "The Mugabe Method",
  "method.h1": "Don’t just",
  "method.h2": "Work out.",
  "method.h3": "Train with purpose.",
  "method.script": "Stronger",
  "method.together": "Together",
  "method.cta.assess": "It starts with you",
  "method.cta.train": "Smarter training",
  "method.cta.progress": "Small steps. Big results.",
  "method.cta.transform": "A stronger you",
  "method.cta.default": "Start training",

  "why.eyebrow": "Why Mugabe Fitness",
  "why.h1": "Built for",
  "why.h2": "Serious",
  "why.h3": "People.",
  "why.note": "Discipline builds freedom.",
  "why.script": "Stronger",
  "why.together": "Together",
  "why.r1.title": "Personal",
  "why.r1.accent": "Coaching",
  "why.r1.text":
    "Training built around the individual—not a generic routine copied from someone else.",
  "why.r2.title": "Real",
  "why.r2.accent": "Accountability",
  "why.r2.text":
    "Consistent coaching, guidance, and structure designed to keep you moving forward.",
  "why.r3.title": "Measurable",
  "why.r3.accent": "Progress",
  "why.r3.text":
    "Train with purpose, track your development, and build progress you can actually see.",

  "coach.eyebrow": "Your Coach",
  "coach.h1": "Built by someone",
  "coach.h2": "Who lives the work.",
  "coach.body":
    "Mugabe Fitness combines strength training, discipline, coaching, and a commitment to continuous improvement. The goal isn’t simply to exercise. It’s to build a stronger version of you.",
  "coach.cta": "Work with me",
  "coach.script": "Stronger",
  "coach.together": "Together",
  "coach.videoTitle": "Meet your coach at Mugabe Fitness",
  "coach.photoHint": "Add one from Admin → Settings",
  "coach.photoAlt": "The coach mid-workout at Mugabe Fitness",
  "coach.photoPlaceholder": "Coach photo",
  "coach.p1.title": "Coaching, not workouts",
  "coach.p1.text":
    "Every session has a reason behind it. You always know what you are doing and why.",
  "coach.p2.title": "Standards over shortcuts",
  "coach.p2.text":
    "Technique first, load second. Progress that holds up is progress worth building.",
  "coach.p3.title": "In it with you",
  "coach.p3.text":
    "The same discipline asked of you is the standard the coaching is held to.",

  "start.eyebrow": "How To Start",
  "start.h1": "Three steps.",
  "start.h2": "That’s it.",
  "start.note1": "Simple steps.",
  "start.note2": "Real progress.",
  "start.note3": "A stronger you.",
  "start.script": "Stronger",
  "start.together": "Together",
  "start.s1.title": "Send your",
  "start.s1.accent": "details",
  "start.s1.text":
    "Fill in the form with your goals, your schedule, and where you are training from.",
  "start.s1.cta": "It takes 2 minutes",
  "start.s2.title": "Talk it",
  "start.s2.accent": "through",
  "start.s2.text":
    "We go over your experience, any injuries, and which program actually fits you.",
  "start.s2.cta": "Personal and direct",
  "start.s3.title": "Start",
  "start.s3.accent": "training",
  "start.s3.text":
    "Your program begins, and the coaching and accountability start from day one.",
  "start.s3.cta": "Let’s go",

  "badge.b1.top": "Better",
  "badge.b1.bottom": "Fitness",
  "badge.b2.top": "Stronger",
  "badge.b2.bottom": "Mindset",
  "badge.b3.top": "Bigger",
  "badge.b3.bottom": "Goals",
  "badge.b4.top": "Real",
  "badge.b4.bottom": "Results",
  "scene.stronger": "Stronger",
  "scene.together": "Together",

  "form.eyebrow": "Your next chapter starts here",
  "form.h1": "Ready to",
  "form.h2": "Rise?",
  "form.lede":
    "Tell me where you are today and what you want to build. I’ll come back to you with the plan that fits.",
  "form.email": "Email",
  "form.phone": "Phone",
  "form.signedIn.a": "Signed in as",
  "form.signedIn.b": "— this request will show in",
  "form.signedIn.link": "your account",
  "form.guest.a": "Have an account?",
  "form.guest.link": "Log in",
  "form.guest.b": "to track your booking and payment from any device.",
  "form.name": "Name",
  "form.namePh": "Your full name",
  "form.phonePh": "+91 00000 00000",
  "form.emailPh": "you@example.com",
  "form.program": "Program",
  "form.notSure": "Not sure yet",
  "form.goalLabel": "Main goal",
  "form.goal.fat": "Fat loss",
  "form.goal.muscle": "Muscle gain",
  "form.goal.strength": "Strength",
  "form.goal.general": "General fitness",
  "form.goal.sport": "Sport performance",
  "form.slot": "Preferred time",
  "form.slotHint": "Slots available for {name}.",
  "form.slotHintAny": "Pick a program above to narrow these down.",
  "form.noPreference": "No preference",
  "form.message": "Anything else",
  "form.messagePh": "Injuries, schedule, experience level…",
  "form.err.name": "Please enter your name.",
  "form.err.email": "Please enter a valid email.",
  "form.err.phone": "Please enter a valid phone number.",
  "form.err.program": "Choose a program to continue to payment.",
  "form.reach": "You can also reach me directly on",
  "form.whatsapp": "WhatsApp",
  "form.or": "or",
  "form.call": "call {phone}",
  "form.sending": "Sending…",
  "form.submit": "Submit",
  "form.payNote": "Next, pay by UPI to confirm your spot.",
  "form.sentTitle": "Request sent",
  "form.sentText":
    "Your details reached me. I’ll get back to you on the phone or email you gave to get you started.",
  "form.thankYou": "Thank you",

  "pay.checking": "Checking your booking…",
  "pay.errorTitle": "Couldn’t check your payment",
  "pay.errorText": "Check your connection and try again.",
  "pay.tryAgain": "Try again",
  "pay.close": "Close",
  "pay.startOver": "Start over",
  "pay.closedTitle": "This request is closed",
  "pay.closedText":
    "It’s no longer open for payment. Send a new request and I’ll pick it up from there.",
  "pay.newRequest": "Start a new request",
  "pay.reviewTitle": "Payment under review",
  "pay.review.withProgram":
    "Thanks — I’m verifying your payment for {program}. This page updates on its own once it’s confirmed.",
  "pay.review.plain":
    "Thanks — I’m verifying your payment. This page updates on its own once it’s confirmed.",
  "pay.txnId": "Transaction ID",
  "pay.checkingNow": "Checking…",
  "pay.checkStatus": "Check status",
  "pay.keepAccount":
    "You can close this — the status is always in your account, on any device.",
  "pay.keepDevice":
    "You can close this page — the status is here whenever you come back on this device.",
  "pay.confirmedTitle": "Booking confirmed",
  "pay.confirmed.withProgram":
    "Your payment is verified and your spot in {program} is confirmed. I’ll reach out on the phone or email you gave to schedule your first session.",
  "pay.confirmed.plain":
    "Your payment is verified. I’ll reach out on the phone or email you gave to schedule your first session.",
  "pay.done": "Done",
  "pay.step": "Step 2 of 2 · Payment",
  "pay.title": "Complete your payment",
  "pay.rejectedTitle": "Your last payment couldn’t be verified.",
  "pay.rejectedText":
    "Check the screenshot and transaction ID, then send them again.",
  "pay.yourProgram": "Your program",
  "pay.amount": "Amount to pay",
  "pay.loadingDetails": "Loading payment details…",
  "pay.offlineTitle": "Online payment details aren’t available right now.",
  "pay.offlineText": "Your request is saved — I’ll contact you with how to pay.",
  "pay.qrAlt": "UPI QR code for {upi}",
  "pay.scan": "Scan with any UPI app",
  "pay.upiId": "UPI ID",
  "pay.copied": "Copied",
  "pay.copy": "Copy",
  "pay.paying": "Paying",
  "pay.openApp": "Open UPI app",
  "pay.step1": "Pay the amount above to this UPI ID.",
  "pay.step2": "Screenshot the successful payment.",
  "pay.step3": "Upload it below with the transaction ID.",
  "pay.shotLabel": "Payment screenshot",
  "pay.shotAlt": "Your payment screenshot",
  "pay.shotAdded": "Screenshot added.",
  "pay.preparing": "Preparing…",
  "pay.change": "Change",
  "pay.upload": "Upload screenshot",
  "pay.fileTypes": "JPG, PNG or WebP",
  "pay.txnLabel": "Transaction ID (UTR)",
  "pay.txnPh": "e.g. 412345678901",
  "pay.txnHint": "The 12-digit UPI reference number shown in your payment app.",
  "pay.err.shot": "Add a screenshot of the successful payment.",
  "pay.err.txn": "Enter the transaction ID — 6 to 40 letters or numbers.",
  "pay.err.image": "That image could not be read.",
  "pay.complete": "Complete Payment",
  "pay.cancel": "Cancel and start over",
  "pay.confirmStartOver":
    "Start a new request? This one stays with the coach, but you won’t be able to pay for it from this page.",

  "auth.eyebrow": "Your account",
  "auth.home": "Mugabe Fitness home",
  "auth.continuing": "Taking you to your booking…",
  "auth.tab.login": "Log in",
  "auth.tab.register": "Create account",
  "auth.tablist": "Log in or create an account",
  "auth.login.top": "Welcome",
  "auth.login.accent": "Back",
  "auth.login.line":
    "Track your progress. Stay consistent. Build the stronger you.",
  "auth.login.submit": "Log in",
  "auth.login.prompt": "New to Mugabe Fitness?",
  "auth.login.switch": "Create an account",
  "auth.register.top": "Join the",
  "auth.register.accent": "Grind",
  "auth.register.line":
    "Book your coaching, pay by UPI, and follow every booking from any device.",
  "auth.register.submit": "Create account",
  "auth.register.prompt": "Already training with us?",
  "auth.register.switch": "Log in instead",
  "auth.chose": "You chose {name}.",
  "auth.chosePlain": "You chose a plan.",
  "auth.choseNote":
    "Log in or create an account to continue — you’ll go straight to the booking form next.",
  "auth.fullName": "Full name",
  "auth.emailLabel": "Email address",
  "auth.password": "Password",
  "auth.pwHint": "At least {min} characters.",
  "auth.pwPhLogin": "Enter your password",
  "auth.pwPhRegister": "Create a password",
  "auth.showPw": "Show password",
  "auth.hidePw": "Hide password",
  "auth.wait": "Please wait…",
  "auth.or": "or",
  "auth.err.name": "Please enter your name.",
  "auth.err.nameLong": "That name is too long.",
  "auth.err.pwShort": "Use at least {min} characters.",
  "auth.err.pwLong": "That password is too long.",
  "auth.err.pwMissing": "Enter your password.",

  "dash.hi": "Hi, {name}",
  "dash.there": "there",
  "dash.logout": "Log out",
  "dash.profile": "Profile",
  "dash.bookings": "Bookings",
  "dash.newBooking": "New booking",
  "dash.loading": "Loading your bookings…",
  "dash.offline": "Bookings can’t be loaded right now. Please try again later.",
  "dash.error": "Couldn’t load your bookings.",
  "dash.retry": "Retry",
  "dash.empty":
    "No bookings yet. Pick a program and send a request while signed in — it will show up here.",
  "dash.tbd": "Program to be decided",
  "dash.willContact": "Coach will contact you",
  "status.none": "Payment due",
  "status.none.action": "Pay now",
  "status.submitted": "Under review",
  "status.submitted.action": "View status",
  "status.verified": "Confirmed",
  "status.verified.action": "View",
  "status.rejected": "Payment rejected",
  "status.rejected.action": "Pay again",
} as const;

export type StringKey = keyof typeof EN;

const HI: Record<StringKey, string> = {
  "lang.switch": "भाषा",
  "lang.en": "EN",
  "lang.hi": "हिं",

  "nav.home": "होम",
  "nav.programs": "प्रोग्राम",
  "nav.method": "तरीका",
  "nav.coach": "कोच",
  "nav.login": "लॉग इन",
  "nav.account": "मेरा अकाउंट",
  "nav.start": "ट्रेनिंग शुरू करें",
  "nav.open": "मेन्यू खोलें",
  "nav.close": "मेन्यू बंद करें",

  "hero.become": "बनिए",
  "hero.stronger": "और मज़बूत।",
  "hero.lede":
    "ऐसी पर्सनल कोचिंग जो आपको सही तरीके से ट्रेनिंग करने, ताकत बढ़ाने, बॉडी बदलने और खुद का सबसे मज़बूत रूप बनने में मदद करती है।",
  "hero.cta": "अपना बदलाव शुरू करें",
  "hero.method": "तरीका जानिए",
  "hero.f1.top": "पर्सनल",
  "hero.f1.bottom": "कोचिंग",
  "hero.f2.top": "असली",
  "hero.f2.bottom": "नतीजे",
  "hero.f3.top": "टिकाऊ",
  "hero.f3.bottom": "प्रगति",
  "hero.f4.top": "मज़बूत",
  "hero.f4.bottom": "आप",
  "hero.photoAlt": "Mugabe Fitness में आपके कोच",

  "footer.explore": "देखें",
  "footer.getStarted": "शुरू करें",
  "footer.reach": "संपर्क करें",
  "footer.theMethod": "तरीका",
  "footer.yourCoach": "आपके कोच",
  "footer.howToStart": "कैसे शुरू करें",
  "footer.book": "प्रोग्राम बुक करें",
  "footer.whatsapp": "WhatsApp पर मैसेज करें",
  "footer.blurb":
    "पर्सनल कोचिंग, जो आपको सही तरीके से ट्रेनिंग करने और खुद का सबसे मज़बूत रूप बनने में मदद करे।",
  "footer.rights": "सर्वाधिकार सुरक्षित।",
  "footer.motto": "उठो · मेहनत करो · चमको",
  "footer.admin": "एडमिन",

  "install.title": "Mugabe Fitness को होम स्क्रीन पर जोड़ें",
  "install.ios": "Share दबाएँ, फिर Add to Home Screen चुनें।",
  "install.android": "ऐप की तरह पूरी स्क्रीन पर खुलता है।",
  "install.action": "इंस्टॉल करें",
  "install.dismiss": "अभी नहीं",

  "programs.eyebrow": "अपना लेवल चुनें",
  "programs.h1": "आपकी ट्रेनिंग।",
  "programs.h2": "आपका लेवल।",
  "programs.lede":
    "हर लेवल के लिए कोचिंग। मेहनत का एक ही स्तर। वह लेवल चुनिए जो आपके लक्ष्य से मेल खाता हो, और वह बॉडी, ताकत और अनुशासन बनाना शुरू कीजिए जो आप चाहते हैं।",
  "programs.p1.top": "मज़बूत",
  "programs.p1.bottom": "हर दिन",
  "programs.p2.top": "असली",
  "programs.p2.bottom": "प्रगति",
  "programs.p3.top": "अनुशासन",
  "programs.p3.bottom": "ज़िंदगी भर",
  "programs.script1": "बेहतर",
  "programs.script2": "मज़बूत",
  "programs.script3": "आप",
  "programs.premium": "प्रीमियम",
  "programs.slots": "ट्रेनिंग का समय",
  "programs.choose": "{name} चुनें",
  "programs.loginNote": "पहले लॉग इन करना या अकाउंट बनाना होगा।",

  "method.eyebrow": "मुगाबे मेथड",
  "method.h1": "सिर्फ़ वर्कआउट",
  "method.h2": "मत कीजिए।",
  "method.h3": "मक़सद के साथ ट्रेनिंग कीजिए।",
  "method.script": "मज़बूत",
  "method.together": "साथ में",
  "method.cta.assess": "शुरुआत आपसे होती है",
  "method.cta.train": "समझदारी से ट्रेनिंग",
  "method.cta.progress": "छोटे कदम। बड़े नतीजे।",
  "method.cta.transform": "और मज़बूत आप",
  "method.cta.default": "ट्रेनिंग शुरू करें",

  "why.eyebrow": "Mugabe Fitness ही क्यों",
  "why.h1": "उनके लिए जो",
  "why.h2": "वाकई",
  "why.h3": "गंभीर हैं।",
  "why.note": "अनुशासन ही असली आज़ादी देता है।",
  "why.script": "मज़बूत",
  "why.together": "साथ में",
  "why.r1.title": "पर्सनल",
  "why.r1.accent": "कोचिंग",
  "why.r1.text":
    "ट्रेनिंग आपके हिसाब से बनती है — किसी और का घिसा-पिटा रूटीन नकल करके नहीं।",
  "why.r2.title": "असली",
  "why.r2.accent": "ज़िम्मेदारी",
  "why.r2.text":
    "लगातार कोचिंग, सही मार्गदर्शन और ऐसा ढाँचा जो आपको आगे बढ़ाता रहे।",
  "why.r3.title": "दिखने वाली",
  "why.r3.accent": "प्रगति",
  "why.r3.text":
    "मक़सद के साथ ट्रेनिंग कीजिए, अपनी प्रगति ट्रैक कीजिए और ऐसे नतीजे बनाइए जो सच में दिखें।",

  "coach.eyebrow": "आपके कोच",
  "coach.h1": "बनाया उसने",
  "coach.h2": "जो खुद यही जीता है।",
  "coach.body":
    "Mugabe Fitness में स्ट्रेंथ ट्रेनिंग, अनुशासन, कोचिंग और लगातार बेहतर होने की लगन साथ आती है। मक़सद सिर्फ़ कसरत करना नहीं है — मक़सद है आपका एक और मज़बूत रूप बनाना।",
  "coach.cta": "मेरे साथ काम कीजिए",
  "coach.script": "मज़बूत",
  "coach.together": "साथ में",
  "coach.videoTitle": "Mugabe Fitness में अपने कोच से मिलिए",
  "coach.photoHint": "एडमिन → सेटिंग्स से जोड़ें",
  "coach.photoAlt": "Mugabe Fitness में ट्रेनिंग करते हुए कोच",
  "coach.photoPlaceholder": "कोच की फोटो",
  "coach.p1.title": "सिर्फ़ वर्कआउट नहीं, कोचिंग",
  "coach.p1.text":
    "हर सेशन के पीछे एक वजह होती है। आपको हमेशा पता रहता है कि आप क्या कर रहे हैं और क्यों।",
  "coach.p2.title": "शॉर्टकट नहीं, सही तरीका",
  "coach.p2.text":
    "पहले तकनीक, फिर वज़न। वही प्रगति काम की है जो टिकती है।",
  "coach.p3.title": "हर कदम आपके साथ",
  "coach.p3.text":
    "जो अनुशासन आपसे माँगा जाता है, कोचिंग खुद भी उसी पर खरी उतरती है।",

  "start.eyebrow": "कैसे शुरू करें",
  "start.h1": "तीन कदम।",
  "start.h2": "बस इतना ही।",
  "start.note1": "आसान कदम।",
  "start.note2": "असली प्रगति।",
  "start.note3": "और मज़बूत आप।",
  "start.script": "मज़बूत",
  "start.together": "साथ में",
  "start.s1.title": "अपनी जानकारी",
  "start.s1.accent": "भेजिए",
  "start.s1.text":
    "फॉर्म में अपने लक्ष्य, अपना समय और आप कहाँ से ट्रेनिंग करेंगे, यह भरिए।",
  "start.s1.cta": "सिर्फ़ 2 मिनट",
  "start.s2.title": "बात",
  "start.s2.accent": "कीजिए",
  "start.s2.text":
    "हम आपके अनुभव, किसी चोट और आपके लिए सही प्रोग्राम पर बात करते हैं।",
  "start.s2.cta": "सीधी और निजी बात",
  "start.s3.title": "ट्रेनिंग",
  "start.s3.accent": "शुरू",
  "start.s3.text":
    "आपका प्रोग्राम शुरू होता है, और पहले ही दिन से कोचिंग और ज़िम्मेदारी साथ चलती है।",
  "start.s3.cta": "चलिए शुरू करें",

  "badge.b1.top": "बेहतर",
  "badge.b1.bottom": "फिटनेस",
  "badge.b2.top": "मज़बूत",
  "badge.b2.bottom": "सोच",
  "badge.b3.top": "बड़े",
  "badge.b3.bottom": "लक्ष्य",
  "badge.b4.top": "असली",
  "badge.b4.bottom": "नतीजे",
  "scene.stronger": "मज़बूत",
  "scene.together": "साथ में",

  "form.eyebrow": "आपका नया अध्याय यहीं से शुरू होता है",
  "form.h1": "तैयार हैं",
  "form.h2": "उठने को?",
  "form.lede":
    "बताइए आप आज कहाँ हैं और क्या बनाना चाहते हैं। मैं आपके लिए सही प्लान लेकर वापस आऊँगा।",
  "form.email": "ईमेल",
  "form.phone": "फ़ोन",
  "form.signedIn.a": "लॉग इन हैं",
  "form.signedIn.b": "— यह रिक्वेस्ट यहाँ दिखेगी:",
  "form.signedIn.link": "आपका अकाउंट",
  "form.guest.a": "अकाउंट है?",
  "form.guest.link": "लॉग इन कीजिए",
  "form.guest.b": "और अपनी बुकिंग व पेमेंट किसी भी डिवाइस पर देखिए।",
  "form.name": "नाम",
  "form.namePh": "आपका पूरा नाम",
  "form.phonePh": "+91 00000 00000",
  "form.emailPh": "you@example.com",
  "form.program": "प्रोग्राम",
  "form.notSure": "अभी तय नहीं",
  "form.goalLabel": "मुख्य लक्ष्य",
  "form.goal.fat": "वज़न घटाना",
  "form.goal.muscle": "मसल बढ़ाना",
  "form.goal.strength": "ताकत",
  "form.goal.general": "सामान्य फिटनेस",
  "form.goal.sport": "खेल प्रदर्शन",
  "form.slot": "पसंदीदा समय",
  "form.slotHint": "{name} के लिए उपलब्ध समय।",
  "form.slotHintAny": "ऊपर प्रोग्राम चुनिए ताकि समय छँट जाएँ।",
  "form.noPreference": "कोई भी समय",
  "form.message": "और कुछ बताना है",
  "form.messagePh": "चोट, समय, अनुभव का स्तर…",
  "form.err.name": "कृपया अपना नाम लिखिए।",
  "form.err.email": "कृपया सही ईमेल लिखिए।",
  "form.err.phone": "कृपया सही फ़ोन नंबर लिखिए।",
  "form.err.program": "पेमेंट के लिए आगे बढ़ने हेतु प्रोग्राम चुनिए।",
  "form.reach": "आप मुझसे सीधे भी संपर्क कर सकते हैं —",
  "form.whatsapp": "WhatsApp",
  "form.or": "या",
  "form.call": "{phone} पर कॉल कीजिए",
  "form.sending": "भेजा जा रहा है…",
  "form.submit": "भेजें",
  "form.payNote": "आगे, अपनी जगह पक्की करने के लिए UPI से भुगतान कीजिए।",
  "form.sentTitle": "रिक्वेस्ट भेज दी गई",
  "form.sentText":
    "आपकी जानकारी मुझ तक पहुँच गई है। शुरुआत के लिए मैं आपके दिए फ़ोन या ईमेल पर संपर्क करूँगा।",
  "form.thankYou": "धन्यवाद",

  "pay.checking": "आपकी बुकिंग देखी जा रही है…",
  "pay.errorTitle": "आपका पेमेंट जाँचा नहीं जा सका",
  "pay.errorText": "अपना इंटरनेट देखिए और दोबारा कोशिश कीजिए।",
  "pay.tryAgain": "दोबारा कोशिश करें",
  "pay.close": "बंद करें",
  "pay.startOver": "फिर से शुरू करें",
  "pay.closedTitle": "यह रिक्वेस्ट बंद हो चुकी है",
  "pay.closedText":
    "इस पर अब भुगतान नहीं हो सकता। नई रिक्वेस्ट भेजिए, मैं वहीं से आगे बढ़ाऊँगा।",
  "pay.newRequest": "नई रिक्वेस्ट भेजें",
  "pay.reviewTitle": "पेमेंट जाँच में है",
  "pay.review.withProgram":
    "धन्यवाद — मैं {program} के लिए आपका पेमेंट जाँच रहा हूँ। पुष्टि होते ही यह पेज खुद अपडेट हो जाएगा।",
  "pay.review.plain":
    "धन्यवाद — मैं आपका पेमेंट जाँच रहा हूँ। पुष्टि होते ही यह पेज खुद अपडेट हो जाएगा।",
  "pay.txnId": "ट्रांज़ैक्शन आईडी",
  "pay.checkingNow": "जाँचा जा रहा है…",
  "pay.checkStatus": "स्थिति देखें",
  "pay.keepAccount":
    "आप इसे बंद कर सकते हैं — स्थिति हमेशा आपके अकाउंट में रहती है, किसी भी डिवाइस पर।",
  "pay.keepDevice":
    "आप यह पेज बंद कर सकते हैं — इसी डिवाइस पर लौटने पर स्थिति यहीं मिलेगी।",
  "pay.confirmedTitle": "बुकिंग पक्की हो गई",
  "pay.confirmed.withProgram":
    "आपका पेमेंट सत्यापित हो गया है और {program} में आपकी जगह पक्की है। पहली सेशन तय करने के लिए मैं आपके दिए फ़ोन या ईमेल पर संपर्क करूँगा।",
  "pay.confirmed.plain":
    "आपका पेमेंट सत्यापित हो गया है। पहली सेशन तय करने के लिए मैं आपके दिए फ़ोन या ईमेल पर संपर्क करूँगा।",
  "pay.done": "हो गया",
  "pay.step": "चरण 2 / 2 · पेमेंट",
  "pay.title": "अपना पेमेंट पूरा कीजिए",
  "pay.rejectedTitle": "आपका पिछला पेमेंट सत्यापित नहीं हो सका।",
  "pay.rejectedText":
    "स्क्रीनशॉट और ट्रांज़ैक्शन आईडी जाँचकर दोबारा भेजिए।",
  "pay.yourProgram": "आपका प्रोग्राम",
  "pay.amount": "देय राशि",
  "pay.loadingDetails": "पेमेंट की जानकारी आ रही है…",
  "pay.offlineTitle": "ऑनलाइन पेमेंट की जानकारी अभी उपलब्ध नहीं है।",
  "pay.offlineText": "आपकी रिक्वेस्ट सेव हो गई है — भुगतान का तरीका मैं आपको बताऊँगा।",
  "pay.qrAlt": "{upi} के लिए UPI QR कोड",
  "pay.scan": "किसी भी UPI ऐप से स्कैन कीजिए",
  "pay.upiId": "UPI आईडी",
  "pay.copied": "कॉपी हो गया",
  "pay.copy": "कॉपी करें",
  "pay.paying": "भुगतान पाने वाले",
  "pay.openApp": "UPI ऐप खोलें",
  "pay.step1": "ऊपर दी गई राशि इस UPI आईडी पर भेजिए।",
  "pay.step2": "सफल भुगतान का स्क्रीनशॉट लीजिए।",
  "pay.step3": "उसे नीचे ट्रांज़ैक्शन आईडी के साथ अपलोड कीजिए।",
  "pay.shotLabel": "पेमेंट का स्क्रीनशॉट",
  "pay.shotAlt": "आपके पेमेंट का स्क्रीनशॉट",
  "pay.shotAdded": "स्क्रीनशॉट जुड़ गया।",
  "pay.preparing": "तैयार किया जा रहा है…",
  "pay.change": "बदलें",
  "pay.upload": "स्क्रीनशॉट अपलोड करें",
  "pay.fileTypes": "JPG, PNG या WebP",
  "pay.txnLabel": "ट्रांज़ैक्शन आईडी (UTR)",
  "pay.txnPh": "जैसे 412345678901",
  "pay.txnHint": "आपके पेमेंट ऐप में दिखने वाला 12 अंकों का UPI रेफ़रेंस नंबर।",
  "pay.err.shot": "सफल भुगतान का स्क्रीनशॉट जोड़िए।",
  "pay.err.txn": "ट्रांज़ैक्शन आईडी लिखिए — 6 से 40 अक्षर या अंक।",
  "pay.err.image": "यह इमेज पढ़ी नहीं जा सकी।",
  "pay.complete": "पेमेंट पूरा करें",
  "pay.cancel": "रद्द करके फिर से शुरू करें",
  "pay.confirmStartOver":
    "नई रिक्वेस्ट शुरू करें? यह रिक्वेस्ट कोच के पास रहेगी, पर इस पेज से आप इसका भुगतान नहीं कर पाएँगे।",

  "auth.eyebrow": "आपका अकाउंट",
  "auth.home": "Mugabe Fitness होम",
  "auth.continuing": "आपको आपकी बुकिंग पर ले जाया जा रहा है…",
  "auth.tab.login": "लॉग इन",
  "auth.tab.register": "अकाउंट बनाएँ",
  "auth.tablist": "लॉग इन कीजिए या अकाउंट बनाइए",
  "auth.login.top": "वापसी पर",
  "auth.login.accent": "स्वागत है",
  "auth.login.line":
    "अपनी प्रगति देखिए। लगातार बने रहिए। और मज़बूत बनिए।",
  "auth.login.submit": "लॉग इन",
  "auth.login.prompt": "Mugabe Fitness पर नए हैं?",
  "auth.login.switch": "अकाउंट बनाइए",
  "auth.register.top": "जुड़िए",
  "auth.register.accent": "मेहनत से",
  "auth.register.line":
    "अपनी कोचिंग बुक कीजिए, UPI से भुगतान कीजिए और हर बुकिंग किसी भी डिवाइस पर देखिए।",
  "auth.register.submit": "अकाउंट बनाएँ",
  "auth.register.prompt": "पहले से हमारे साथ ट्रेनिंग कर रहे हैं?",
  "auth.register.switch": "लॉग इन कीजिए",
  "auth.chose": "आपने {name} चुना है।",
  "auth.chosePlain": "आपने एक प्लान चुना है।",
  "auth.choseNote":
    "आगे बढ़ने के लिए लॉग इन कीजिए या अकाउंट बनाइए — इसके बाद आप सीधे बुकिंग फॉर्म पर पहुँचेंगे।",
  "auth.fullName": "पूरा नाम",
  "auth.emailLabel": "ईमेल पता",
  "auth.password": "पासवर्ड",
  "auth.pwHint": "कम से कम {min} अक्षर।",
  "auth.pwPhLogin": "अपना पासवर्ड लिखिए",
  "auth.pwPhRegister": "नया पासवर्ड बनाइए",
  "auth.showPw": "पासवर्ड दिखाएँ",
  "auth.hidePw": "पासवर्ड छिपाएँ",
  "auth.wait": "कृपया प्रतीक्षा कीजिए…",
  "auth.or": "या",
  "auth.err.name": "कृपया अपना नाम लिखिए।",
  "auth.err.nameLong": "यह नाम बहुत लंबा है।",
  "auth.err.pwShort": "कम से कम {min} अक्षर रखिए।",
  "auth.err.pwLong": "यह पासवर्ड बहुत लंबा है।",
  "auth.err.pwMissing": "अपना पासवर्ड लिखिए।",

  "dash.hi": "नमस्ते, {name}",
  "dash.there": "दोस्त",
  "dash.logout": "लॉग आउट",
  "dash.profile": "प्रोफ़ाइल",
  "dash.bookings": "बुकिंग",
  "dash.newBooking": "नई बुकिंग",
  "dash.loading": "आपकी बुकिंग आ रही हैं…",
  "dash.offline": "बुकिंग अभी नहीं आ पा रहीं। कृपया बाद में कोशिश कीजिए।",
  "dash.error": "आपकी बुकिंग नहीं आ सकीं।",
  "dash.retry": "फिर कोशिश करें",
  "dash.empty":
    "अभी कोई बुकिंग नहीं है। लॉग इन रहते हुए प्रोग्राम चुनकर रिक्वेस्ट भेजिए — वह यहाँ दिखेगी।",
  "dash.tbd": "प्रोग्राम अभी तय होना है",
  "dash.willContact": "कोच आपसे संपर्क करेंगे",
  "status.none": "भुगतान बाकी",
  "status.none.action": "अभी भुगतान करें",
  "status.submitted": "जाँच में",
  "status.submitted.action": "स्थिति देखें",
  "status.verified": "पक्की",
  "status.verified.action": "देखें",
  "status.rejected": "भुगतान अस्वीकृत",
  "status.rejected.action": "दोबारा भुगतान करें",
};

const DICTIONARIES: Record<Lang, Record<StringKey, string>> = {
  en: EN,
  hi: HI,
};

/* ------------------------------------------------------------------ */
/* Which language is in use                                            */
/* ------------------------------------------------------------------ */

let lang: Lang | null = null;
const listeners = new Set<() => void>();

function detect(): Lang {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (saved === "en" || saved === "hi") return saved;
  } catch {
    // Storage blocked: fall through to the phone setting.
  }

  const preferred = window.navigator.languages ?? [window.navigator.language];

  return preferred.some((tag) => tag?.toLowerCase().startsWith("hi"))
    ? "hi"
    : "en";
}

/** Cached, because useSyncExternalStore calls this on every render and needs
 *  the same answer each time. */
function readLang(): Lang {
  if (lang === null) lang = detect();

  return lang;
}

export function setLang(next: Lang) {
  lang = next;

  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // The choice simply will not survive a reload.
  }

  for (const listener of listeners) listener();
}

export function subscribeLang(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getLangOnServer(): Lang {
  // The server has no way to know, so it renders English and the browser
  // swaps to Hindi after hydration — same markup on both sides.
  return "en";
}

export function useLang(): Lang {
  return useSyncExternalStore(subscribeLang, readLang, getLangOnServer);
}

/** `const t = useT()` then `t("nav.home")`. */
export function useT() {
  const current = useLang();

  return (key: StringKey) => DICTIONARIES[current][key] ?? EN[key];
}
