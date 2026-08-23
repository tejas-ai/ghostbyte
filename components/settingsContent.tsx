import React from 'react';
import type { Language } from '../contexts/LanguageContext';

export interface LocalizedVideo {
  title: string;
  desc: string;
  src: string;
  difficulty: string;
}

export interface LocalizedBlogPost {
  id: number;
  title: string;
  date: string;
  readTime: string;
  summary: string;
  content: React.ReactNode;
}

export interface LocalizedAboutCard {
  label: string;
  val: string;
  desc: string;
}

export interface LocalizedAboutData {
  cards: [LocalizedAboutCard, LocalizedAboutCard, LocalizedAboutCard];
  tableTitle: string;
  table: [string, string][];
}

export const getPrivacyContent = (lang: Language): React.ReactNode => {
  switch (lang) {
    case 'Kannada':
      return (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-mono">
            🛡️ <strong>ಶೂನ್ಯ-ಸರ್ವರ್ ಧಾರಣ ಗ್ಯಾರಂಟಿ:</strong> QuietSend ನಿಮ್ಮ ಯಾವುದೇ ರಹಸ್ಯ ಡೇಟಾವನ್ನು ಬಾಹ್ಯ ಸರ್ವರ್‌ಗಳಿಗೆ ರವಾನಿಸುವುದಿಲ್ಲ.
          </div>
          <h4 className="text-white font-bold text-base mt-2">1. ಸ್ಥಳೀಯ ಬ್ರೌಸರ್ ಎಕ್ಸಿಕ್ಯೂಶನ್</h4>
          <p>100% ಕ್ರಿಪ್ಟೋಗ್ರಾಫಿಕ್ ಕಾರ್ಯಾಚರಣೆಗಳು, PBKDF2 ಆವರ್ತನೆಗಳು, AES-GCM-256 ರೂಪಾಂತರಗಳು ಮತ್ತು ಪಿಕ್ಸೆಲ್ ಬಿಟ್‌ಸ್ಟ್ರೀಮ್ ಮಾರ್ಪಾಡುಗಳು ನಿಮ್ಮ ಸ್ಥಳೀಯ ಬ್ರೌಸರ್ ಮೆಮೊರಿ (RAM) ಸ್ಯಾಂಡ್‌ಬಾಕ್ಸ್‌ನಲ್ಲಿಯೇ ಕಾರ್ಯಗತಗೊಳ್ಳುತ್ತವೆ.</p>
          
          <h4 className="text-white font-bold text-base mt-2">2. ಶೂನ್ಯ ನೆಟ್‌ವರ್ಕ್ ಟ್ರಾನ್ಸ್‌ಮಿಷನ್</h4>
          <p>ಯಾವುದೇ ವಾಹಕ ಫೈಲ್‌ಗಳು, ಪಾಸ್‌ವರ್ಡ್‌ಗಳು, ರಹಸ್ಯ ಪಠ್ಯ ಅಥವಾ ಪೇಲೋಡ್ ಬೈಟ್‌ಗಳು ಯಾವುದೇ ನೆಟ್‌ವರ್ಕ್ ಗಡಿಯನ್ನು ದಾಟಿ ಪ್ರಸಾರವಾಗುವುದಿಲ್ಲ ಅಥವಾ ಕ್ಲೌಡ್‌ನಲ್ಲಿ ಸಂಗ್ರಹವಾಗುವುದಿಲ್ಲ.</p>

          <h4 className="text-white font-bold text-base mt-2">3. ಕೀ ನೈರ್ಮಲ್ಯ ಮತ್ತು ಸ್ವಯಂಚಾಲಿತ ಮೆಮೊರಿ ನಿರ್ಮಲೀಕರಣ</h4>
          <p>ಕಾರ್ಯಾಚರಣೆ ಪೂರ್ಣಗೊಂಡ ತಕ್ಷಣ, ಕೀಗಳು ಮತ್ತು ಬೈಟ್‌ಸ್ಟ್ರೀಮ್‌ಗಳನ್ನು ಬ್ರೌಸರ್ ಮೆಮೊರಿಯಿಂದ ತಕ್ಷಣವೇ ತೆರವುಗೊಳಿಸಲಾಗುತ್ತದೆ, ಯಾವುದೇ ಡಿಜಿಟಲ್ ಹೆಜ್ಜೆಗುರುತುಗಳು ಉಳಿಯುವುದಿಲ್ಲ.</p>
        </div>
      );
    case 'Hindi':
      return (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-mono">
            🛡️ <strong>शून्य-सर्वर प्रतिधारण गारंटी:</strong> QuietSend आपके किसी भी गोपनीय डेटा को बाहरी सर्वर पर प्रेषित नहीं करता है।
          </div>
          <h4 className="text-white font-bold text-base mt-2">1. स्थानीय ब्राउज़र निष्पादन</h4>
          <p>100% क्रिप्टोग्राफ़िक संचालन, PBKDF2 पुनरावृत्तियाँ, AES-GCM-256 रूपांतरण और पिक्सेल बिटस्ट्रीम संशोधन आपके स्थानीय ब्राउज़र मेमोरी (RAM) सैंडबॉक्स के अंदर निष्पादित होते हैं।</p>
          
          <h4 className="text-white font-bold text-base mt-2">2. शून्य नेटवर्क ट्रांसमिशन</h4>
          <p>कोई भी वाहक फ़ाइलें, पासवर्ड, गुप्त टेक्स्ट या पेलोड बाइट्स कभी भी किसी नेटवर्क सीमा के पार प्रसारित नहीं होते हैं और न ही क्लाउड पर संग्रहीत होते हैं।</p>

          <h4 className="text-white font-bold text-base mt-2">3. कुंजी स्वच्छता और स्वचालित मेमोरी निष्कासन</h4>
          <p>ऑपरेशन पूरा होते ही, कुंजियों और बाइटस्ट्रीम को तुरंत ब्राउज़र मेमोरी से साफ़ कर दिया जाता है, जिससे कोई डिजिटल पदचिह्न नहीं बचता।</p>
        </div>
      );
    case 'Spanish':
      return (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-mono">
            🛡️ <strong>Garantía de Cero Retención en Servidor:</strong> QuietSend nunca transmite sus datos confidenciales a servidores externos.
          </div>
          <h4 className="text-white font-bold text-base mt-2">1. Ejecución Local en el Navegador</h4>
          <p>El 100% de las operaciones criptográficas, iteraciones PBKDF2, transformaciones AES-GCM-256 y modificaciones de flujo de bits de píxeles se ejecutan dentro del entorno seguro de memoria (RAM) de su navegador local.</p>
          
          <h4 className="text-white font-bold text-base mt-2">2. Cero Transmisión de Red</h4>
          <p>Ningún archivo portador, contraseña, texto secreto o byte de carga útil se transmite a través de ninguna red ni se almacena en la nube.</p>

          <h4 className="text-white font-bold text-base mt-2">3. Higiene de Claves y Limpieza de Memoria</h4>
          <p>Una vez completada la codificación o decodificación, las claves criptográficas y los flujos binarios se eliminan de inmediato de la memoria.</p>
        </div>
      );
    case 'French':
      return (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-mono">
            🛡️ <strong>Garantie de Zéro Rétention sur Serveur:</strong> QuietSend ne transmet jamais vos données confidentielles à des serveurs externes.
          </div>
          <h4 className="text-white font-bold text-base mt-2">1. Exécution Locale dans le Navigateur</h4>
          <p>100% des opérations cryptographiques, itérations PBKDF2, transformations AES-GCM-256 et modifications du flux de bits de pixels s'exécutent dans la mémoire vive (RAM) sandbox de votre navigateur local.</p>
          
          <h4 className="text-white font-bold text-base mt-2">2. Zéro Transmission Réseau</h4>
          <p>Aucun fichier porteur, mot de passe, texte secret ou octet de charge utile n'est jamais transmis sur un réseau ni stocké dans le cloud.</p>

          <h4 className="text-white font-bold text-base mt-2">3. Hygiène des Clés et Purge de la Mémoire</h4>
          <p>Dès que le traitement est terminé, les clés et flux binaires sont immédiatement purgés de la mémoire du navigateur.</p>
        </div>
      );
    default:
      return (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-mono">
            🛡️ <strong>Zero-Server Retention Guarantee:</strong> QuietSend never transmits your confidential payload data to external servers.
          </div>
          <h4 className="text-white font-bold text-base mt-2">1. 100% Client-Side RAM Sandbox Execution</h4>
          <p>100% of cryptographic operations, PBKDF2-HMAC-SHA256 derivations (600,000 rounds), AES-GCM-256 ciphers, and pixel bitstream modifications execute strictly inside your local browser memory sandbox.</p>
          
          <h4 className="text-white font-bold text-base mt-2">2. Zero Cloud Network Transmission</h4>
          <p>No carrier media, passwords, decrypted plaintext, or multi-file vault bytes ever traverse any network boundary or touch third-party cloud infrastructure.</p>

          <h4 className="text-white font-bold text-base mt-2">3. Ephemeral Key Hygiene & Garbage Collection</h4>
          <p>Cryptographic keys and raw bitstream buffers are disposed of immediately after processing, leaving no forensic residual data in local storage.</p>
        </div>
      );
  }
};

export const getTermsContent = (lang: Language): React.ReactNode => {
  switch (lang) {
    case 'Kannada':
      return (
        <div className="space-y-4">
          <h4 className="text-white font-bold text-base">1. ಉದ್ದೇಶಿತ ಬಳಕೆ</h4>
          <p>QuietSend ಅನ್ನು ಕಾನೂನುಬದ್ಧ ಖಾಸಗಿ ಸಂವಹನ, ಗೌಪ್ಯ ಡೇಟಾ ರಕ್ಷಣೆ ಮತ್ತು ಡಿಜಿಟಲ್ ವಾಟರ್‌ಮಾರ್ಕಿಂಗ್ ಪರಿಶೀಲನೆಗಾಗಿ ವಿನ್ಯಾಸಗೊಳಿಸಲಾಗಿದೆ.</p>
          
          <h4 className="text-white font-bold text-base mt-2">2. ಬಳಕೆದಾರರ ಜವಾಬ್ದಾರಿ</h4>
          <p>ವಾಹಕ ಮಾಧ್ಯಮ ಮತ್ತು ರಹಸ್ಯ ಪ್ರಸರಣಗಳು ಎಲ್ಲಾ ಅನ್ವಯವಾಗುವ ಸ್ಥಳೀಯ ಮತ್ತು ಅಂತರರಾಷ್ಟ್ರೀಯ ನಿಯಮಾವಳಿಗಳಿಗೆ ಅನುಗುಣವಾಗಿವೆ ಎಂದು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಲು ಬಳಕೆದಾರರೇ ಸಂಪೂರ್ಣ ಜವಾಬ್ದಾರರಾಗಿರುತ್ತಾರೆ.</p>

          <h4 className="text-white font-bold text-base mt-2">3. ಶೂನ್ಯ ಹೊಣೆಗಾರಿಕೆ ಹಕ್ಕು ನಿರಾಕರಣೆ</h4>
          <p>ವೇದಿಕೆಯು ಮುಕ್ತ-ಮೂಲ ಉಲ್ಲೇಖ ಪ್ರೋಟೋಕಾಲ್ ಆಗಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ ಮತ್ತು ಮೂರನೇ ವ್ಯಕ್ತಿಯ ವೇದಿಕೆಗಳಿಂದ ಉಂಟಾಗುವ ಡೇಟಾ ನಷ್ಟಕ್ಕೆ ಯಾವುದೇ ಹೊಣೆಗಾರಿಕೆಯನ್ನು ತೆಗೆದುಕೊಳ್ಳುವುದಿಲ್ಲ.</p>
        </div>
      );
    case 'Hindi':
      return (
        <div className="space-y-4">
          <h4 className="text-white font-bold text-base">1. इच्छित उपयोग</h4>
          <p>QuietSend को वैध निजी संचार, गोपनीय डेटा सुरक्षा और डिजिटल वॉटरमार्किंग सत्यापन के लिए डिज़ाइन किया गया है।</p>
          
          <h4 className="text-white font-bold text-base mt-2">2. उपयोगकर्ता की जिम्मेदारी</h4>
          <p>उपयोगकर्ता यह सुनिश्चित करने के लिए पूरी तरह से जिम्मेदार हैं कि वाहक मीडिया और ट्रांसमिशन सभी लागू स्थानीय और अंतर्राष्ट्रीय नियमों का अनुपालन करते हैं।</p>

          <h4 className="text-white font-bold text-base mt-2">3. दायित्व अस्वीकरण</h4>
          <p>प्लेटफ़ॉर्म एक ओपन-सोर्स संदर्भ प्रोटोकॉल के रूप में काम करता है और तीसरे पक्ष के प्लेटफ़ॉर्म के कारण होने वाले डेटा हानि के लिए कोई दायित्व नहीं लेता है।</p>
        </div>
      );
    case 'Spanish':
      return (
        <div className="space-y-4">
          <h4 className="text-white font-bold text-base">1. Uso Previsto</h4>
          <p>QuietSend está diseñado para comunicaciones privadas legítimas, protección de datos confidenciales y verificación de marcas de agua digitales.</p>
          
          <h4 className="text-white font-bold text-base mt-2">2. Responsabilidad del Usuario</h4>
          <p>Los usuarios son los únicos responsables de garantizar que los medios portadores y las transmisiones cumplan con las regulaciones locales e internacionales aplicables.</p>

          <h4 className="text-white font-bold text-base mt-2">3. Descargo de Responsabilidad</h4>
          <p>La plataforma opera como un protocolo de referencia de código abierto y no asume responsabilidad por la pérdida de datos causada por plataformas de terceros.</p>
        </div>
      );
    case 'French':
      return (
        <div className="space-y-4">
          <h4 className="text-white font-bold text-base">1. Utilisation Prévue</h4>
          <p>QuietSend est conçu pour les communications privées légitimes, la protection des données confidentielles et le filigranage numérique.</p>
          
          <h4 className="text-white font-bold text-base mt-2">2. Responsabilité de l'Utilisateur</h4>
          <p>Les utilisateurs sont seuls responsables de s'assurer que les médias porteurs et les transmissions sont conformes aux réglementations locales et internationales applicables.</p>

          <h4 className="text-white font-bold text-base mt-2">3. Clause de Non-Responsabilité</h4>
          <p>La plateforme fonctionne comme un protocole de référence open-source et décline toute responsabilité en cas de perte de données causée par des tiers.</p>
        </div>
      );
    default:
      return (
        <div className="space-y-4">
          <h4 className="text-white font-bold text-base">1. Intended Cryptographic Use</h4>
          <p>QuietSend is engineered for legitimate private communications, sensitive document vaulting, digital copyright watermarking, and privacy preservation.</p>
          
          <h4 className="text-white font-bold text-base mt-2">2. User Compliance Responsibility</h4>
          <p>Operators and users bear sole responsibility for ensuring that all carrier media ingestion, encrypted payloads, and subsequent transmissions strictly comply with jurisdictional laws and data protection directives.</p>

          <h4 className="text-white font-bold text-base mt-2">3. No-Warranty Open Architecture</h4>
          <p>QuietSend operates client-side under open cryptographic references with zero warranties regarding downstream carrier manipulation by third-party intermediaries.</p>
        </div>
      );
  }
};

export const getGuidelinesContent = (lang: Language): React.ReactNode => {
  switch (lang) {
    case 'Kannada':
      return (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono">
            ⚠️ <strong>ಸುವರ್ಣ ನಿಯಮ:</strong> ಯಾವಾಗಲೂ ಸ್ಟೆಗಾನೋಗ್ರಾಫಿಕ್ ಚಿತ್ರಗಳನ್ನು <strong>ನಷ್ಟವಿಲ್ಲದ PNG ಸ್ವರೂಪದಲ್ಲಿ</strong> ಹಂಚಿಕೊಳ್ಳಿ.
          </div>
          <h4 className="text-white font-bold text-base mt-2">1. ಸಂಕೋಚನದ ಬಲೆಗಳನ್ನು ತಪ್ಪಿಸಿ</h4>
          <p>WhatsApp, Instagram, Facebook ಮತ್ತು ಇತರ ಸಾಮಾಜಿಕ ಅಪ್ಲಿಕೇಶನ್‌ಗಳು ಚಿತ್ರಗಳನ್ನು ಮರು-ಸಂಕೋಚನ (re-compress) ಮಾಡುತ್ತವೆ, ಇದು LSB ಬಿಟ್‌ಸ್ಟ್ರೀಮ್‌ಗಳನ್ನು ನಾಶಮಾಡುತ್ತದೆ. ಯಾವಾಗಲೂ ಫೈಲ್‌ಗಳನ್ನು "ಡಾಕ್ಯುಮೆಂಟ್" (Document) ಆಗಿ ಕಳುಹಿಸಿ.</p>
          
          <h4 className="text-white font-bold text-base mt-2">2. ಬಲವಾದ ಪಾಸ್‌ಫ್ರೇಸ್ ಬಳಕೆ</h4>
          <p>ಕನಿಷ್ಠ 16+ ಅಕ್ಷರಗಳು, ಅಂಕಿಗಳು ಮತ್ತು ಚಿಹ್ನೆಗಳನ್ನು ಒಳಗೊಂಡಿರುವ ಪಾಸ್‌ಫ್ರೇಸ್‌ಗಳನ್ನು ಬಳಸಿ. ಅಂತರ್ನಿರ್ಮಿತ ಪಾಸ್‌ಫ್ರೇಸ್ ಜನರೇಟರ್ ಗರಿಷ್ಠ ಎಂಟ್ರೊಪಿಯನ್ನು ಒದಗಿಸುತ್ತದೆ.</p>

          <h4 className="text-white font-bold text-base mt-2">3. ವಾಹಕ ಚಿತ್ರದ ಗಾತ್ರ</h4>
          <p>ಹೆಚ್ಚಿನ ರೆಸಲ್ಯೂಶನ್ ಹೊಂದಿರುವ ನೈಸರ್ಗಿಕ ಛಾಯಾಚಿತ್ರಗಳು ಅತ್ಯುತ್ತಮ ರಹಸ್ಯತೆ ಮತ್ತು ಗರಿಷ್ಠ ಶೇಖರಣಾ ಸಾಮರ್ಥ್ಯವನ್ನು ನೀಡುತ್ತವೆ.</p>
        </div>
      );
    case 'Hindi':
      return (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono">
            ⚠️ <strong>स्वर्ण नियम:</strong> हमेशा स्टेगनोग्राफिक छवियों को <strong>दोषरहित PNG प्रारूप</strong> में साझा करें।
          </div>
          <h4 className="text-white font-bold text-base mt-2">1. संपीड़न के जाल से बचें</h4>
          <p>WhatsApp, Instagram और अन्य सोशल मीडिया ऐप्स छवियों को पुनः संपीड़ित (re-compress) करते हैं, जिससे LSB बिटस्ट्रीम नष्ट हो जाती है। हमेशा फ़ाइलों को "दस्तावेज़" (Document) के रूप में भेजें।</p>
          
          <h4 className="text-white font-bold text-base mt-2">2. मजबूत पासफ़्रेज़ का उपयोग</h4>
          <p>कम से कम 16+ वर्णों, संख्याओं और प्रतीकों वाले पासफ़्रेज़ का उपयोग करें। अंतर्निहित पासफ़्रेज़ जनरेटर अधिकतम एन्ट्रॉपी प्रदान करता है।</p>

          <h4 className="text-white font-bold text-base mt-2">3. वाहक छवि का आकार</h4>
          <p>उच्च रिज़ॉल्यूशन वाली प्राकृतिक तस्वीरें सर्वोत्तम गोपनीयता और अधिकतम भंडारण क्षमता प्रदान करती हैं।</p>
        </div>
      );
    case 'Spanish':
      return (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono">
            ⚠️ <strong>Regla de Oro:</strong> Comparta siempre las imágenes esteganográficas en <strong>formato PNG sin pérdidas</strong>.
          </div>
          <h4 className="text-white font-bold text-base mt-2">1. Evite Trampas de Compresión</h4>
          <p>Las aplicaciones de mensajería (WhatsApp, Instagram) recomprimen las imágenes, destruyendo los bits LSB. Envíe siempre las imágenes como "Documento" sin compresión.</p>
          
          <h4 className="text-white font-bold text-base mt-2">2. Uso de Frases de Contraseña Fuertes</h4>
          <p>Utilice frases de contraseña de 16+ caracteres con alta entropía. El generador integrado garantiza claves criptográficamente seguras.</p>

          <h4 className="text-white font-bold text-base mt-2">3. Selección de Imagen Portadora</h4>
          <p>Las fotografías naturales de alta resolución con ruido ISO ofrecen el mayor sigilo visual y capacidad de almacenamiento.</p>
        </div>
      );
    case 'French':
      return (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono">
            ⚠️ <strong>Règle d'Or :</strong> Partagez toujours les images stéganographiques au <strong>format PNG sans perte</strong>.
          </div>
          <h4 className="text-white font-bold text-base mt-2">1. Évitez les Pièges de Compression</h4>
          <p>Les applications de messagerie (WhatsApp, Instagram) recompressent les images, détruisant les flux LSB. Envoyez toujours en tant que "Document" non compressé.</p>
          
          <h4 className="text-white font-bold text-base mt-2">2. Phrases Secrètes Robustes</h4>
          <p>Utilisez des clés de 16+ caractères. Le générateur intégré garantit une entropie cryptographique maximale.</p>

          <h4 className="text-white font-bold text-base mt-2">3. Sélection de l'Image Porteuse</h4>
          <p>Les photographies naturelles haute résolution offrent la plus grande discrétion et capacité de stockage.</p>
        </div>
      );
    default:
      return (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono">
            ⚠️ <strong>The Golden Rule:</strong> Always preserve and transmit steganographic carriers in <strong>lossless PNG format</strong>.
          </div>
          <h4 className="text-white font-bold text-base mt-2">1. Evading Social Media Compression Traps</h4>
          <p>Mainstream messaging platforms (WhatsApp, Telegram standard media, Instagram, Discord standard) apply aggressive lossy JPEG/WebP quantization algorithms that wipe high-frequency spatial noise and corrupt LSB payloads. <strong>Always send as an uncompressed "Document/File attachment".</strong></p>
          
          <h4 className="text-white font-bold text-base mt-2">2. High-Entropy Passphrase Architecture</h4>
          <p>Utilize passphrases with 16+ alphanumeric and special characters. Our WebCrypto PBKDF2 key derivation (600,000 SHA-256 iterations) ensures brute-force resilience when strong keys are used.</p>

          <h4 className="text-white font-bold text-base mt-2">3. Carrier Selection for Optimal Stealth</h4>
          <p>Rich, natural textures (foliage, urban architecture, low-light photography with natural sensor ISO noise) provide superior masking for 4-bit spatial multiplexing compared to flat solid-color backgrounds.</p>
        </div>
      );
  }
};

export const getVideos = (lang: Language): LocalizedVideo[] => {
  switch (lang) {
    case 'Kannada':
      return [
        { title: "ಚಿತ್ರದೊಳಗೆ ರಹಸ್ಯ ಪಠ್ಯವನ್ನು ಅಡಗಿಸಿ", desc: "ಮೂಲಭೂತ ಪಠ್ಯ ಸ್ಟೆಗಾನೋಗ್ರಫಿ ಕಲಿಯಿರಿ", src: "/videos/pt1.mp4", difficulty: "ಪ್ರಾರಂಭಿಕ" },
        { title: "ಮತ್ತೊಂದು ಚಿತ್ರದೊಳಗೆ ರಹಸ್ಯ ಚಿತ್ರಗಳನ್ನು ಅಡಗಿಸಿ", desc: "ಸುಧಾರಿತ ಚಿತ್ರದೊಳಗೆ ಚಿತ್ರ ಅಡಗಿಸುವ ತಂತ್ರ", src: "/videos/pt2.mp4", difficulty: "ಮಧ್ಯಂತರ" },
        { title: "ಚಿತ್ರದೊಳಗೆ MP3 ಫೈಲ್‌ಗಳನ್ನು ಅಡಗಿಸಿ", desc: "ಆಡಿಯೊ ಫೈಲ್‌ಗಳನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಅಡಗಿಸಿ", src: "/videos/pt3.mp4", difficulty: "ಮಧ್ಯಂತರ" },
        { title: "ಚಿತ್ರದೊಳಗೆ PDF ಫೈಲ್‌ಗಳನ್ನು ಅಡಗಿಸಿ", desc: "ದಾಖಲೆ ಸ್ಟೆಗಾನೋಗ್ರಫಿ ತಂತ್ರಗಳು", src: "/videos/pt4.mp4", difficulty: "ಸುಧಾರಿತ" },
        { title: "ಚಿತ್ರದೊಳಗೆ EXE ಫೈಲ್‌ಗಳನ್ನು ಅಡಗಿಸಿ", desc: "ಎಕ್ಸಿಕ್ಯೂಟೇಬಲ್ ಫೈಲ್ ಮರೆಮಾಚುವಿಕೆ", src: "/videos/pt5.mp4", difficulty: "ಸುಧಾರಿತ" },
        { title: "ಸಾಮಾನ್ಯ ಚಿತ್ರ vs ಎನ್‌ಕೋಡ್ ಮಾಡಿದ ಚಿತ್ರವನ್ನು ಹೋಲಿಕೆ ಮಾಡಿ", desc: "ದೃಶ್ಯ ಮತ್ತು ಬಿಟ್-ಮಟ್ಟದ ವಿಶ್ಲೇಷಣೆ", src: "/videos/ppt6.mp4", difficulty: "ತಜ್ಞ" },
      ];
    case 'Hindi':
      return [
        { title: "छवि के अंदर गुप्त टेक्स्ट छिपाएं", desc: "बुनियादी टेक्स्ट स्टेग्नोग्राफ़ी सीखें", src: "/videos/pt1.mp4", difficulty: "शुरुआती" },
        { title: "दूसरी छवि के अंदर गुप्त छवियां छिपाएं", desc: "उन्नत छवि-में-छवि छिपाना", src: "/videos/pt2.mp4", difficulty: "मध्यम" },
        { title: "छवि के अंदर MP3 फ़ाइलें छिपाएं", desc: "ऑडियो फ़ाइलों को सुरक्षित रूप से छुपाएं", src: "/videos/pt3.mp4", difficulty: "मध्यम" },
        { title: "छवि के अंदर PDF फ़ाइलें छिपाएं", desc: "दस्तावेज़ स्टेग्नोग्राफ़ी तकनीक", src: "/videos/pt4.mp4", difficulty: "उन्नत" },
        { title: "छवि के अंदर EXE फ़ाइलें छिपाएं", desc: "निष्पादन योग्य फ़ाइल छिपाव", src: "/videos/pt5.mp4", difficulty: "उन्नत" },
        { title: "सामान्य छवि बनाम एन्कोडेड छवि की तुलना करें", desc: "दृश्य और बिट-स्तरीय विश्लेषण", src: "/videos/ppt6.mp4", difficulty: "विशेषज्ञ" },
      ];
    case 'Spanish':
      return [
        { title: "Ocultar Texto Secreto Dentro de una Imagen", desc: "Aprenda esteganografía de texto básica", src: "/videos/pt1.mp4", difficulty: "Principiante" },
        { title: "Ocultar Imágenes Secretas Dentro de Otra Imagen", desc: "Ocultación avanzada de imagen en imagen", src: "/videos/pt2.mp4", difficulty: "Intermedio" },
        { title: "Ocultar Archivos MP3 Dentro de una Imagen", desc: "Oculte archivos de audio de forma segura", src: "/videos/pt3.mp4", difficulty: "Intermedio" },
        { title: "Ocultar Archivos PDF Dentro de una Imagen", desc: "Técnicas de esteganografía de documentos", src: "/videos/pt4.mp4", difficulty: "Avanzado" },
        { title: "Ocultar Archivos EXE Dentro de una Imagen", desc: "Ocultación de archivos ejecutables", src: "/videos/pt5.mp4", difficulty: "Avanzado" },
        { title: "Comparar Imagen Normal vs Imagen Codificada", desc: "Análisis visual y a nivel de bits", src: "/videos/ppt6.mp4", difficulty: "Experto" },
      ];
    case 'French':
      return [
        { title: "Cacher du Texte Secret dans une Image", desc: "Apprenez la stéganographie de texte de base", src: "/videos/pt1.mp4", difficulty: "Débutant" },
        { title: "Cacher des Images Secrètes dans une Autre Image", desc: "Dissimulation avancée d'image dans une image", src: "/videos/pt2.mp4", difficulty: "Intermédiaire" },
        { title: "Cacher des Fichiers MP3 dans une Image", desc: "Dissimulez des fichiers audio en toute sécurité", src: "/videos/pt3.mp4", difficulty: "Intermédiaire" },
        { title: "Cacher des Fichiers PDF dans une Image", desc: "Techniques de stéganographie de documents", src: "/videos/pt4.mp4", difficulty: "Avancé" },
        { title: "Cacher des Fichiers EXE dans une Image", desc: "Dissimulation de fichiers exécutables", src: "/videos/pt5.mp4", difficulty: "Avancé" },
        { title: "Comparer une Image Normale et une Image Encodée", desc: "Analyse visuelle et au niveau du bit", src: "/videos/ppt6.mp4", difficulty: "Expert" },
      ];
    default:
      return [
        { title: "Hide Secret Text Inside an Image", desc: "Learn basic text steganography", src: "/videos/pt1.mp4", difficulty: "Beginner" },
        { title: "Hide Secret Images Inside Another Image", desc: "Advanced image-in-image hiding", src: "/videos/pt2.mp4", difficulty: "Intermediate" },
        { title: "Hide MP3 Files Inside an Image", desc: "Conceal audio files securely", src: "/videos/pt3.mp4", difficulty: "Intermediate" },
        { title: "Hide PDF Files Inside an Image", desc: "Document steganography techniques", src: "/videos/pt4.mp4", difficulty: "Advanced" },
        { title: "Hide EXE Files Inside an Image", desc: "Executable file concealment", src: "/videos/pt5.mp4", difficulty: "Advanced" },
        { title: "Compare Normal Image vs Encoded Image", desc: "Visual and bit-level analysis", src: "/videos/ppt6.mp4", difficulty: "Expert" },
      ];
  }
};

export const getBlogPosts = (lang: Language): LocalizedBlogPost[] => {
  switch (lang) {
    case 'Kannada':
      return [
        {
          id: 1,
          title: "LSB4 ಪ್ರಾದೇಶಿಕ ಸ್ಟೆಗಾನೋಗ್ರಫಿಯನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳುವುದು",
          date: "10 ಜನವರಿ 2026",
          readTime: "5 ನಿಮಿಷ ಓದು",
          summary: "4-ಬಿಟ್ ಲೀಸ್ಟ್ ಸಿಗ್ನಿಫಿಕೆಂಟ್ ಬಿಟ್ ಪ್ರಾದೇಶಿಕ ಮಲ್ಟಿಪ್ಲೆಕ್ಸಿಂಗ್ ಅಲ್ಗಾರಿದಮ್ ದೃಶ್ಯ ಗ್ರಹಿಕೆಯನ್ನು ಬದಲಾಯಿಸದೆ ಕಣ್ಣೆದುರೇ ಡೇಟಾವನ್ನು ಹೇಗೆ ಅಡಗಿಸುತ್ತದೆ ಎಂಬುದನ್ನು ತಿಳಿಯಿರಿ.",
          content: (
            <>
              <p>ಲೀಸ್ಟ್ ಸಿಗ್ನಿಫಿಕೆಂಟ್ ಬಿಟ್ (LSB) ಸ್ಟೆಗಾನೋಗ್ರಫಿಯು ಡಿಜಿಟಲ್ ಚಿತ್ರಗಳಲ್ಲಿ ಡೇಟಾವನ್ನು ಮರೆಮಾಡಲು ಅತ್ಯಂತ ಪರಿಣಾಮಕಾರಿ ತಂತ್ರಗಳಲ್ಲಿ ಒಂದಾಗಿದೆ. ಇದು ಪ್ರತಿ ಪಿಕ್ಸೆಲ್‌ನ ಬಣ್ಣ ಚಾನಲ್‌ಗಳ ಕೆಳಗಿನ ನಿಬಲ್ ಅನ್ನು ಪೇಲೋಡ್ ಬಿಟ್‌ಗಳೊಂದಿಗೆ ಬದಲಿಸುವ ಮೂಲಕ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ.</p>
              <h4 className="text-white font-bold mt-6 mb-2">ಇದು ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ</h4>
              <p>ಡಿಜಿಟಲ್ ಚಿತ್ರಗಳು ಪಿಕ್ಸೆಲ್‌ಗಳಿಂದ ಮಾಡಲ್ಪಟ್ಟಿವೆ ಮತ್ತು ಪ್ರತಿ ಪಿಕ್ಸೆಲ್ ಅನ್ನು ಮೂರು ವಿಭಿನ್ನ ಬಣ್ಣ ಚಾನಲ್‌ಗಳಿಂದ ಪ್ರತಿನಿಧಿಸಲಾಗುತ್ತದೆ: ಕೆಂಪು, ಹಸಿರು ಮತ್ತು ನೀಲಿ (RGB). ಪ್ರತಿ ಚಾನಲ್ 8 ಬಿಟ್‌ಗಳನ್ನು ಹೊಂದಿರುತ್ತದೆ (0–255).</p>
              <p className="mt-4">ಕೆಳಗಿನ 4 ಬಿಟ್‌ಗಳನ್ನು ಮಾರ್ಪಡಿಸುವುದರಿಂದ ±8 ತೀವ್ರತೆಯ ಮಟ್ಟಗಳ ಸಣ್ಣ ವ್ಯತ್ಯಾಸ ಉಂಟಾಗುತ್ತದೆ (&lt; 3.1% ವ್ಯತ್ಯಾಸ), ಇದು PSNR ರೇಟಿಂಗ್‌ಗಳನ್ನು &gt; 42 dB ಸಾಧಿಸುತ್ತದೆ, ಇದು ಮಾನವನ ಕಣ್ಣಿಗೆ ಸಂಪೂರ್ಣವಾಗಿ ಅಗೋಚರವಾಗಿರುತ್ತದೆ.</p>
              <h4 className="text-white font-bold mt-6 mb-2">QuietSend ಇದನ್ನು ಏಕೆ ಬಳಸುತ್ತದೆ</h4>
              <p>ಚಿತ್ರದ ಸಂಪೂರ್ಣ ಸ್ಥಿರತೆಯನ್ನು ಖಾತರಿಪಡಿಸಲು ಆಲ್ಫಾ ಚಾನಲ್ ಅನ್ನು ಲಾಕ್ ಮಾಡುವಾಗ QuietSend ಎಲ್ಲಾ ಮೂರು RGB ಚಾನಲ್‌ಗಳಲ್ಲಿ ಡೇಟಾವನ್ನು ವಿತರಿಸುತ್ತದೆ.</p>
            </>
          )
        },
        {
          id: 2,
          title: "ಎನ್‌ಕ್ರಿಪ್ಶನ್ vs. ಸ್ಟೆಗಾನೋಗ್ರಫಿ",
          date: "22 ಡಿಸೆಂಬರ್ 2025",
          readTime: "8 ನಿಮಿಷ ಓದು",
          summary: "ಆಧುನಿಕ ಕಣ್ಗಾವಲು ಯುಗದಲ್ಲಿ ಸಂದೇಶದ ವಿಷಯವನ್ನು ಎನ್‌ಕ್ರಿಪ್ಟ್ ಮಾಡುವುದರಷ್ಟೇ ಅದರ ಅಸ್ತಿತ್ವವನ್ನು ಮರೆಮಾಡುವುದು ಏಕೆ ಮುಖ್ಯವಾಗಿದೆ.",
          content: (
            <>
              <p>ಎನ್‌ಕ್ರಿಪ್ಶನ್ ಸಂದೇಶದ <strong>ವಿಷಯವನ್ನು</strong> ರಕ್ಷಿಸಿದರೆ, ಸ್ಟೆಗಾನೋಗ್ರಫಿಯು ಸಂದೇಶದ <strong>ಅಸ್ತಿತ್ವವನ್ನೇ</strong> ರಕ್ಷಿಸುತ್ತದೆ.</p>
              <h4 className="text-white font-bold mt-6 mb-2">ಕೇವಲ ಎನ್‌ಕ್ರಿಪ್ಶನ್‌ನೊಂದಿಗಿನ ಸಮಸ್ಯೆ</h4>
              <p>ನೀವು ಎನ್‌ಕ್ರಿಪ್ಟ್ ಮಾಡಿದ ಫೈಲ್ ಅನ್ನು ಕಳುಹಿಸಿದರೆ, ಅದನ್ನು ತಡೆಹಿಡಿಯುವ ಯಾರಿಗಾದರೂ ನೀವು ಏನನ್ನಾದರೂ ಮರೆಮಾಡುತ್ತಿದ್ದೀರಿ ಎಂದು ತಿಳಿಯುತ್ತದೆ. ಇದು ಕಣ್ಗಾವಲು ಮತ್ತು ಟ್ರಾಫಿಕ್ ವಿಶ್ಲೇಷಣೆಗೆ ಗುರಿಯಾಗಿಸುತ್ತದೆ.</p>
              <h4 className="text-white font-bold mt-6 mb-2">ಸ್ಟೆಗಾನೋಗ್ರಫಿಯ ಪ್ರಯೋಜನ</h4>
              <p>ಸ್ಟೆಗಾನೋಗ್ರಫಿಯು ಸಂದೇಶವನ್ನು ಸಾಮಾನ್ಯ ಚಿತ್ರದೊಳಗೆ ಅಡಗಿಸುತ್ತದೆ. <strong>QuietSend</strong> ಎರಡನ್ನೂ ಸಂಯೋಜಿಸುತ್ತದೆ: ನಾವು ಮೊದಲು ನಿಮ್ಮ ಪೇಲೋಡ್ ಅನ್ನು AES-GCM-256 (600,000 PBKDF2 ಆವರ್ತನೆಗಳು) ನೊಂದಿಗೆ ಎನ್‌ಕ್ರಿಪ್ಟ್ ಮಾಡುತ್ತೇವೆ, ನಂತರ ಅದನ್ನು ಚಿತ್ರದ ಶಬ್ದದಲ್ಲಿ ಎಂಬೆಡ್ ಮಾಡುತ್ತೇವೆ.</p>
            </>
          )
        },
        {
          id: 3,
          title: "ಶೂನ್ಯ-ಸರ್ವರ್ ಧಾರಣ ವಾಸ್ತುಶಿಲ್ಪ",
          date: "15 ನವೆಂಬರ್ 2025",
          readTime: "6 ನಿಮಿಷ ಓದು",
          summary: "ಕ್ಲೌಡ್ ಬ್ಯಾಕೆಂಡ್‌ಗಳಿಗೆ ಒಂದೇ ಒಂದು ಬೈಟ್ ರವಾನಿಸದೆ QuietSend ಹೇಗೆ 100% ಸ್ಥಳೀಯ ಬ್ರೌಸರ್ ಮೆಮೊರಿಯಲ್ಲಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ.",
          content: (
            <>
              <p>ಆಧುನಿಕ ವೆಬ್ ಭದ್ರತೆಯಲ್ಲಿ, ಸುರಕ್ಷಿತ ಸರ್ವರ್ ಎಂದರೆ ಯಾವುದೇ ಸರ್ವರ್ ಇಲ್ಲದಿರುವುದು. QuietSend ಎಲ್ಲಾ ಕೀಗಳು, ವಾಹಕಗಳು ಮತ್ತು ಎನ್‌ಕ್ರಿಪ್ಶನ್‌ಗಳನ್ನು ಸಂಪೂರ್ಣವಾಗಿ ಕ್ಲೈಂಟ್-ಸೈಡ್ RAM ನಲ್ಲಿ ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲು HTML5 Canvas 2D ಎಂಜಿನ್ ಮತ್ತು Web Crypto API (SubtleCrypto) ಅನ್ನು ಬಳಸುತ್ತದೆ.</p>
            </>
          )
        }
      ];

    case 'Hindi':
      return [
        {
          id: 1,
          title: "LSB4 स्थानिक स्टेग्नोग्राफ़ी को समझना",
          date: "10 जनवरी 2026",
          readTime: "5 मिनट पढ़ना",
          summary: "जानें कि 4-बिट लीस्ट सिग्निफिकेंट बिट स्थानिक मल्टीप्लेक्सिंग एल्गोरिदम दृश्य धारणा को बदले बिना डेटा को कैसे छुपाता है।",
          content: (
            <>
              <p>लीस्ट सिग्निफिकेंट बिट (LSB) स्टेग्नोग्राफ़ी डिजिटल छवियों के भीतर डेटा छिपाने की सबसे प्रभावी तकनीकों में से एक है। यह प्रत्येक पिक्सेल के रंग चैनलों के निचले निबल को पेलोड बिट्स से बदलकर काम करता है।</p>
              <h4 className="text-white font-bold mt-6 mb-2">यह कैसे काम करता है</h4>
              <p>डिजिटल छवियां पिक्सेल से बनी होती हैं, और प्रत्येक पिक्सेल को तीन अलग-अलग रंग चैनलों द्वारा दर्शाया जाता है: लाल, हरा और नीला (RGB)। प्रत्येक चैनल 8 बिट्स (0–255) का होता है।</p>
              <p className="mt-4">निचले 4 बिट्स को संशोधित करने से ±8 तीव्रता स्तरों का सूक्ष्म अंतर उत्पन्न होता है (&lt; 3.1% विचरण), जिससे PSNR रेटिंग &gt; 42 dB प्राप्त होती है, जो मानव आंख के लिए पूरी तरह से अदृश्य है।</p>
              <h4 className="text-white font-bold mt-6 mb-2">QuietSend इसका उपयोग क्यों करता है</h4>
              <p>पूर्ण छवि स्थिरता की गारंटी के लिए अल्फा चैनल को लॉक करते हुए QuietSend सभी तीन RGB चैनलों में डेटा वितरित करता है।</p>
            </>
          )
        },
        {
          id: 2,
          title: "एन्क्रिप्शन बनाम स्टेग्नोग्राफ़ी",
          date: "22 दिसंबर 2025",
          readTime: "8 मिनट पढ़ना",
          summary: "आधुनिक निगरानी युग में संदेश के अस्तित्व को छिपाना उतना ही महत्वपूर्ण क्यों है जितना कि उसे एन्क्रिप्ट करना।",
          content: (
            <>
              <p>जबकि एन्क्रिप्शन संदेश की <strong>सामग्री</strong> की सुरक्षा करता है, स्टेग्नोग्राफ़ी संदेश के <strong>अस्तित्व</strong> की सुरक्षा करती है।</p>
              <h4 className="text-white font-bold mt-6 mb-2">केवल एन्क्रिप्शन की समस्या</h4>
              <p>यदि आप एन्क्रिप्ट की गई फ़ाइल भेजते हैं, तो उसे रोकने वाले किसी भी व्यक्ति को पता चल जाता है कि आप कुछ छिपा रहे हैं। यह अकेले ही आपको ट्रैफ़िक विश्लेषण और निगरानी के संपर्क में ला सकता है।</p>
              <h4 className="text-white font-bold mt-6 mb-2">स्टेग्नोग्राफ़ी का लाभ</h4>
              <p>स्टेग्नोग्राफ़ी संदेश को एक निर्दोष दिखने वाली वाहक फ़ाइल के अंदर छुपाती है। <strong>QuietSend</strong> दोनों को जोड़ता है: हम पहले आपके पेलोड को AES-GCM-256 (600,000 PBKDF2 पुनरावृत्तियाँ) से एन्क्रिप्ट करते हैं, फिर इसे छवि शोर में मल्टीप्लेक्स करते हैं।</p>
            </>
          )
        },
        {
          id: 3,
          title: "शून्य-सर्वर-प्रतिधारण वास्तुकला",
          date: "15 नवंबर 2025",
          readTime: "6 मिनट पढ़ना",
          summary: "क्लाउड बैकएंड पर एक भी बाइट प्रसारित किए बिना QuietSend स्थानीय ब्राउज़र मेमोरी में 100% कैसे निष्पादित होता है।",
          content: (
            <>
              <p>आधुनिक वेब सुरक्षा में, सबसे सुरक्षित सर्वर वह है जो मौजूद ही नहीं है। QuietSend सभी कुंजियों, वाहकों और एन्क्रिप्शन को क्लाइंट-साइड RAM में पूरी तरह से संसाधित करने के लिए HTML5 Canvas 2D इंजन और Web Crypto API (SubtleCrypto) का उपयोग करता है।</p>
            </>
          )
        }
      ];

    case 'Spanish':
      return [
        {
          id: 1,
          title: "Comprendiendo la Esteganografía Espacial LSB4",
          date: "10 de ene de 2026",
          readTime: "5 min de lectura",
          summary: "Aprenda cómo el algoritmo de multiplexación espacial de 4 bits menos significativos oculta datos a simple vista sin alterar la percepción visual.",
          content: (
            <>
              <p>La esteganografía de bit menos significativo (LSB) es una de las técnicas más efectivas para ocultar datos dentro de imágenes digitales. Funciona reemplazando el cuarteto inferior de los canales de color de cada píxel con bits de carga útil.</p>
              <h4 className="text-white font-bold mt-6 mb-2">Cómo funciona</h4>
              <p>Las imágenes digitales se componen de píxeles, y cada píxel se representa mediante tres canales de color: Rojo, Verde y Azul (RGB). Cada canal tiene 8 bits (0–255).</p>
              <p className="mt-4">Modificar los 4 bits inferiores produce variaciones discretas de ±8 niveles de intensidad (&lt; 3.1% de varianza), logrando índices PSNR empíricos &gt; 42 dB, totalmente imperceptibles para el ojo humano.</p>
              <h4 className="text-white font-bold mt-6 mb-2">Por qué QuietSend lo utiliza</h4>
              <p>QuietSend distribuye los datos en los tres canales RGB mientras bloquea el canal Alfa para garantizar la estabilidad visual absoluta de la imagen.</p>
            </>
          )
        },
        {
          id: 2,
          title: "Cifrado vs. Esteganografía",
          date: "22 de dic de 2025",
          readTime: "8 min de lectura",
          summary: "Por qué ocultar la existencia de un mensaje es tan importante como cifrarlo en la era de la vigilancia moderna.",
          content: (
            <>
              <p>Mientras que el cifrado protege el <strong>contenido</strong> de un mensaje, la esteganografía protege la <strong>existencia</strong> del mensaje mismo.</p>
              <h4 className="text-white font-bold mt-6 mb-2">El problema del cifrado por sí solo</h4>
              <p>Si envía un archivo cifrado, cualquiera que lo intercepte sabe que está ocultando algo. Esto expone a los actores al análisis de tráfico y la vigilancia.</p>
              <h4 className="text-white font-bold mt-6 mb-2">La ventaja esteganográfica</h4>
              <p>La esteganografía oculta el mensaje dentro de un archivo portador de aspecto inocente. <strong>QuietSend</strong> combina ambos: primero ciframos su carga útil con AES-GCM-256 (600,000 iteraciones PBKDF2), luego la multiplexamos en el ruido de la imagen.</p>
            </>
          )
        },
        {
          id: 3,
          title: "Arquitectura de Cero Retención en Servidor",
          date: "15 de nov de 2025",
          readTime: "6 min de lectura",
          summary: "Cómo QuietSend se ejecuta al 100% en la memoria del navegador local sin transmitir un solo byte a servidores en la nube.",
          content: (
            <>
              <p>En la seguridad web moderna, el servidor más seguro es el que no existe. QuietSend utiliza el motor HTML5 Canvas 2D y la Web Crypto API (SubtleCrypto) para procesar todas las claves, portadores y cifrados completamente en la memoria RAM del cliente.</p>
            </>
          )
        }
      ];

    case 'French':
      return [
        {
          id: 1,
          title: "Comprendre la Stéganographie Spatiale LSB4",
          date: "10 janv. 2026",
          readTime: "5 min de lecture",
          summary: "Découvrez comment l'algorithme de multiplexage spatial à 4 bits de poids faible dissimule des données à la vue de tous sans altérer la perception visuelle.",
          content: (
            <>
              <p>La stéganographie par bit de poids faible (LSB) est l'une des techniques les plus efficaces pour cacher des données dans des images numériques. Elle remplace le quartet inférieur des canaux de couleur de chaque pixel par des bits de charge utile.</p>
              <h4 className="text-white font-bold mt-6 mb-2">Comment ça fonctionne</h4>
              <p>Les images numériques sont composées de pixels, et chaque pixel est représenté par trois canaux de couleur distincts : Rouge, Vert et Bleu (RVB). Chaque canal fait 8 bits (0–255).</p>
              <p className="mt-4">La modification des 4 bits inférieurs produit des variations discrètes de ±8 niveaux d'intensité (&lt; 3.1% de variance), atteignant des scores PSNR empiriques &gt; 42 dB, visuellement imperceptibles pour l'œil humain.</p>
              <h4 className="text-white font-bold mt-6 mb-2">Pourquoi QuietSend l'utilise</h4>
              <p>QuietSend distribue les données sur les trois canaux RVB tout en verrouillant le canal Alpha pour garantir une stabilité absolue de l'image.</p>
            </>
          )
        },
        {
          id: 2,
          title: "Chiffrement vs Stéganographie",
          date: "22 déc. 2025",
          readTime: "8 min de lecture",
          summary: "Pourquoi cacher l'existence d'un message est tout aussi important que de le chiffrer à l'ère de la surveillance moderne.",
          content: (
            <>
              <p>Tandis que le chiffrement protège le <strong>contenu</strong> d'un message, la stéganographie protège l'<strong>existence</strong> du message lui-même.</p>
              <h4 className="text-white font-bold mt-6 mb-2">Le problème du chiffrement seul</h4>
              <p>Si vous envoyez un fichier chiffré, quiconque l'intercepte sait que vous cachez quelque chose. Cela expose à l'analyse du trafic et à la surveillance.</p>
              <h4 className="text-white font-bold mt-6 mb-2">L'avantage de la stéganographie</h4>
              <p>La stéganographie dissimule le message dans un fichier porteur d'apparence innocente. <strong>QuietSend</strong> combine les deux : nous chiffrons d'abord votre charge utile avec AES-GCM-256 (600 000 itérations PBKDF2), puis nous la multiplexons dans le bruit de l'image.</p>
            </>
          )
        },
        {
          id: 3,
          title: "Architecture Zéro Rétention sur Serveur",
          date: "15 nov. 2025",
          readTime: "6 min de lecture",
          summary: "Comment QuietSend s'exécute à 100% dans la mémoire du navigateur local sans transmettre un seul octet aux serveurs cloud.",
          content: (
            <>
              <p>Dans la sécurité web moderne, le serveur le plus sûr est l'absence totale de serveur. QuietSend utilise le moteur HTML5 Canvas 2D et la Web Crypto API (SubtleCrypto) pour traiter toutes les clés, porteurs et chiffrements entièrement côté client dans la RAM.</p>
            </>
          )
        }
      ];

    default:
      return [
        {
          id: 1,
          title: "Understanding LSB4 Spatial Steganography",
          date: "Jan 10, 2026",
          readTime: "5 min read",
          summary: "Learn how the 4-bit Least Significant Bit spatial multiplexing algorithm hides data in plain sight without altering visual perception.",
          content: (
            <>
              <p>Least Significant Bit (LSB) steganography is one of the most effective techniques for hiding data within digital images. It works by replacing the lower nibble of each pixel's color channels with payload bits.</p>
              <h4 className="text-white font-bold mt-6 mb-2">How it works</h4>
              <p>Digital images are made up of pixels, and each pixel is represented by three distinct color channels: Red, Green, and Blue (RGB). Each channel is 8 bits (0–255).</p>
              <p className="mt-4">Modifying the lower 4 bits produces discrete variations ±8 intensity levels (&lt; 3.1% variance), achieving empirical PSNR ratings &gt; 42 dB, which is visually imperceptible to the human eye.</p>
              <h4 className="text-white font-bold mt-6 mb-2">Why QuietSend uses it</h4>
              <p>QuietSend distributes data across all three RGB channels while locking the Alpha channel to guarantee absolute image stability.</p>
            </>
          )
        },
        {
          id: 2,
          title: "Encryption vs. Steganography",
          date: "Dec 22, 2025",
          readTime: "8 min read",
          summary: "Why hiding the existence of a message is just as important as encrypting it in the modern surveillance era.",
          content: (
            <>
              <p>While encryption protects the <strong>content</strong> of a message, steganography protects the <strong>existence</strong> of the message itself.</p>
              <h4 className="text-white font-bold mt-6 mb-2">The Problem with Encryption Alone</h4>
              <p>If you send an encrypted file, anyone intercepting it knows you are hiding something. This alone can expose actors to traffic analysis and surveillance.</p>
              <h4 className="text-white font-bold mt-6 mb-2">The Steganography Advantage</h4>
              <p>Steganography hides the message inside an innocent-looking carrier file. <strong>QuietSend</strong> combines both: we encrypt your payload first with AES-GCM-256 (600,000 PBKDF2 iterations), then multiplex it into the image noise.</p>
            </>
          )
        },
        {
          id: 3,
          title: "Zero-Server-Retention Architecture",
          date: "Nov 15, 2025",
          readTime: "6 min read",
          summary: "How QuietSend executes 100% in local browser memory without transmitting a single byte to cloud backends.",
          content: (
            <>
              <p>In modern web security, the safest server is no server at all. QuietSend utilizes the HTML5 Canvas 2D engine and Web Crypto API (SubtleCrypto) to process all keys, carriers, and encryptions completely client-side in RAM.</p>
            </>
          )
        }
      ];
  }
};

export const getAboutData = (lang: Language): LocalizedAboutData => {
  switch (lang) {
    case 'Kannada':
      return {
        cards: [
          { label: 'ಕ್ರಿಪ್ಟೋಗ್ರಫಿ', val: 'AES-GCM-256', desc: '600,000 ಪುನರಾವರ್ತನೆಗಳು ಮತ್ತು 16B ಸಾಲ್ಟ್ ಹೊಂದಿರುವ PBKDF2' },
          { label: 'ಸ್ಟೆಗಾನೋಗ್ರಫಿ', val: 'LSB4 ಪ್ರಾದೇಶಿಕ', desc: 'RGB ಮಲ್ಟಿಪ್ಲೆಕ್ಸಿಂಗ್ · PSNR > 42 dB' },
          { label: 'ಧಾರಣ', val: 'ಶೂನ್ಯ-ಸರ್ವರ್', desc: '100% ಕ್ಲೈಂಟ್-ಸೈಡ್ ಮೆಮೊರಿ ಎಕ್ಸಿಕ್ಯೂಶನ್' },
        ],
        tableTitle: 'ಸಿಸ್ಟಮ್ ವಿಶೇಷಣ ಕೋಷ್ಟಕ',
        table: [
          ['ಆವೃತ್ತಿ', '3.0.0-PRO'],
          ['ಪ್ರೋಟೋಕಾಲ್', 'GhostVault / GhostFile'],
          ['ತಂತ್ರಜ್ಞಾನ', 'React 19 · Vite · WebCrypto'],
          ['ಲೇಖಕ', 'Tejas J H (314CS23078)'],
          ['ಭದ್ರತೆ', 'ಶೂನ್ಯ ಕ್ಲೌಡ್ ಪ್ರಸರಣ'],
          ['ಪರವಾನಗಿ', 'ಓಪನ್ ಸೋರ್ಸ್ ರೆಫರೆನ್ಸ್'],
        ]
      };
    case 'Hindi':
      return {
        cards: [
          { label: 'क्रिप्टोग्राफी', val: 'AES-GCM-256', desc: '600,000 पुनरावृत्तियाँ और 16B सॉल्ट के साथ PBKDF2' },
          { label: 'स्टेग्नोग्राफ़ी', val: 'LSB4 स्थानिक', desc: 'RGB मल्टीप्लेक्सिंग · PSNR > 42 dB' },
          { label: 'प्रतिधारण', val: 'शून्य-सर्वर', desc: '100% क्लाइंट-साइड मेमोरी निष्पादन' },
        ],
        tableTitle: 'सिस्टम विनिर्देश तालिका',
        table: [
          ['संस्करण', '3.0.0-PRO'],
          ['प्रोटोकॉल', 'GhostVault / GhostFile'],
          ['स्टैक', 'React 19 · Vite · WebCrypto'],
          ['लेखक', 'Tejas J H (314CS23078)'],
          ['सुरक्षा', 'शून्य क्लाउड ट्रांसमिशन'],
          ['लाइसेंस', 'ओपन सोर्स संदर्भ'],
        ]
      };
    case 'Spanish':
      return {
        cards: [
          { label: 'Criptografía', val: 'AES-GCM-256', desc: 'PBKDF2 con 600,000 iteraciones y sal de 16B' },
          { label: 'Esteganografía', val: 'LSB4 Espacial', desc: 'Multiplexación RGB · PSNR > 42 dB' },
          { label: 'Retención', val: 'Cero-Servidor', desc: 'Ejecución en memoria 100% del lado del cliente' },
        ],
        tableTitle: 'Tabla de Especificaciones del Sistema',
        table: [
          ['VERSIÓN', '3.0.0-PRO'],
          ['PROTOCOLO', 'GhostVault / GhostFile'],
          ['TECNOLOGÍA', 'React 19 · Vite · WebCrypto'],
          ['AUTOR', 'Tejas J H (314CS23078)'],
          ['SEGURIDAD', 'Cero Transmisión en la Nube'],
          ['LICENCIA', 'Referencia de Código Abierto'],
        ]
      };
    case 'French':
      return {
        cards: [
          { label: 'Cryptographie', val: 'AES-GCM-256', desc: 'PBKDF2 avec 600 000 itérations et sel de 16 octets' },
          { label: 'Stéganographie', val: 'LSB4 Spatial', desc: 'Multiplexage RVB · PSNR > 42 dB' },
          { label: 'Rétention', val: 'Zéro-Serveur', desc: 'Exécution en mémoire 100% côté client' },
        ],
        tableTitle: 'Tableau des Spécifications du Système',
        table: [
          ['VERSION', '3.0.0-PRO'],
          ['PROTOCOLE', 'GhostVault / GhostFile'],
          ['STACK', 'React 19 · Vite · WebCrypto'],
          ['AUTEUR', 'Tejas J H (314CS23078)'],
          ['SÉCURITÉ', 'Zéro Transmission Cloud'],
          ['LICENCE', 'Référence Open Source'],
        ]
      };
    default:
      return {
        cards: [
          { label: 'Cryptography', val: 'AES-GCM-256', desc: 'PBKDF2 with 600,000 iters & 16B salt' },
          { label: 'Steganography', val: 'LSB4 Spatial', desc: 'RGB multiplexing · PSNR > 42 dB' },
          { label: 'Retention', val: 'Zero-Server', desc: '100% client-side memory execution' },
        ],
        tableTitle: 'System Specification Table',
        table: [
          ['VERSION', '3.0.0-PRO'],
          ['PROTOCOL', 'GhostVault / GhostFile'],
          ['STACK', 'React 19 · Vite · WebCrypto'],
          ['AUTHOR', 'Tejas J H (314CS23078)'],
          ['SECURITY', 'Zero Cloud Transmission'],
          ['LICENSE', 'Open Source Reference'],
        ]
      };
  }
};
