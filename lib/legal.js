export const COMPANY = {
  name: "Exclusive News India Private Limited",
  brand: "NEWS INFO9",
  cin: "U22300AP2021PTC117885",
  address: "D.No. 3-126, Indrapalem, Kakinada, Kakinada District, Andhra Pradesh – 533006, India",
  phone: "+91 90106 81168",
  phoneRaw: "+919010681168",
  email: "newsinfo9india@gmail.com",
  site: "https://newsinfo9.vercel.app",
  grievance: { name: "Sunkara Sudheer", role: "Grievance Officer & Director" },
  updated: "26 November 2026"
};

const C = COMPANY;

export const PAGES = {
  about: {
    title: "About & Contact",
    te: "మా గురించి & సంప్రదించండి",
    sections: [
      ["Who we are", [
        `${C.brand}® is a Telugu and English short-news website and mobile app that brings local, district, state and national news in about 60 words.`,
        `${C.brand}® is a registered trademark of ${C.name} and is owned, operated and published by ${C.name} (CIN ${C.cin}).`
      ]],
      ["How our news is made", [
        "News is written by our reporters, who are given login access only by our editorial desk. Every story submitted by a reporter is reviewed and approved by the editorial desk before it is published.",
        "The name of the reporter or source is shown with every story. Corrections can be requested through the contact details below."
      ]],
      ["Publisher", [
        C.name,
        `Registered office: ${C.address}`,
        `CIN: ${C.cin}`
      ]],
      ["Contact us", [
        `Email: ${C.email}`,
        `Phone / WhatsApp: ${C.phone}`,
        `Website: ${C.site}`
      ]]
    ]
  },
  grievance: {
    title: "Grievance Redressal",
    te: "ఫిర్యాదుల పరిష్కారం",
    sections: [
      ["Grievance Officer", [
        `In accordance with the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, ${C.name} has appointed the following Grievance Officer:`,
        `Name: ${C.grievance.name}`,
        `Designation: ${C.grievance.role}`,
        `Email: ${C.email}`,
        `Phone: ${C.phone}`,
        `Address: ${C.address}`
      ]],
      ["How to file a complaint", [
        "Send your complaint by email or post with: your name and contact details, the link or title of the story, and the reason for your complaint.",
        "We will acknowledge your complaint within 24 hours and take a decision within 15 days of receiving it. The decision will be communicated to you by email or phone."
      ]],
      ["Corrections", [
        "If a published story contains a factual error, please write to us. Verified errors are corrected or the story is removed, and a note is added where appropriate."
      ]]
    ]
  },
  privacy: {
    title: "Privacy Policy",
    te: "గోప్యతా విధానం",
    sections: [
      ["Introduction", [
        `This Privacy Policy explains how ${C.name} ("we", "us") handles information when you use the ${C.brand} website (${C.site}) and the ${C.brand} mobile app (together, the "Service").`
      ]],
      ["Readers", [
        "You can read news without creating an account. We do not ask readers for their name, phone number, email or location.",
        "Your settings (language, dark mode, font size, chosen district) and saved stories are stored only on your own device. They are not sent to our servers.",
        "When you share a story to WhatsApp or another app, the share card image is created on your device and sent by the app you choose. We do not see your contacts or messages."
      ]],
      ["Reporters", [
        "Reporter accounts are created only by our editorial desk. For reporters we store name, email, phone number, district, a securely hashed password, and the stories and photos they submit.",
        "This information is used only to manage reporter access and to show the reporter's name with their stories.",
        "Photos are uploaded only when a reporter chooses to attach them to a story. The app asks for camera or gallery permission only at that moment."
      ]],
      ["Technical data", [
        "Like all websites, our hosting provider may record basic technical logs (such as IP address, browser type and time of request) to keep the Service secure and working. We do not use these logs to identify readers, and we do not sell any data.",
        "We do not use advertising trackers in the app at this time. If this changes, this policy will be updated."
      ]],
      ["Service providers", [
        "Our website and database are hosted with Vercel and Neon (PostgreSQL), and photos are stored with Vercel Blob storage. These providers process data only to provide their services to us."
      ]],
      ["Data retention and deletion", [
        `Reporters can ask us to delete their account and personal data by writing to ${C.email}. We will delete it within 30 days, except where we must keep records by law. Published news stories may be kept as part of our news archive with the reporter's name removed on request.`,
        "Readers can delete all locally stored settings and saved stories by clearing the app's data or uninstalling the app."
      ]],
      ["Children", [
        "The Service is a general news service and is not directed at children under 13. We do not knowingly collect personal information from children."
      ]],
      ["Security", [
        "Passwords are stored only in hashed form, connections use HTTPS, and admin access is limited to authorised staff."
      ]],
      ["Changes and contact", [
        `We may update this policy from time to time. The latest version will always be on this page. Last updated: ${C.updated}.`,
        `Questions: ${C.email} · ${C.phone} · ${C.address}`
      ]]
    ]
  },
  terms: {
    title: "Terms of Use",
    te: "వినియోగ నిబంధనలు",
    sections: [
      ["Acceptance", [
        `By using ${C.brand} you agree to these terms. The Service is provided by ${C.name}.`
      ]],
      ["Content", [
        `All news, images, logos and design on ${C.brand} belong to ${C.name} or their respective owners. ${C.brand}® is a registered trademark. You may share stories using the share buttons, but you may not copy or republish our content as your own.`,
        "We try to publish accurate news, but stories are short summaries and may not contain every detail. Please rely on official sources for important decisions."
      ]],
      ["Reporters", [
        "Reporters must submit only true, original information and photos that they have the right to use. Stories that are false, defamatory, hateful, obscene or that break the law will be rejected, and the reporter's access may be removed."
      ]],
      ["Liability", [
        "The Service is provided \"as is\". To the extent permitted by law, we are not liable for any loss arising from use of the Service."
      ]],
      ["Law", [
        "These terms are governed by the laws of India. Courts at Kakinada, Andhra Pradesh shall have jurisdiction."
      ]],
      ["Contact", [
        `${C.email} · ${C.phone}`
      ]]
    ]
  }
};
