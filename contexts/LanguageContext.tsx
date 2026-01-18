import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'English' | 'Hindi' | 'Kannada' | 'Spanish' | 'French';

interface Translations {
    nav: {
        encode: string;
        decode: string;
        compare: string;
        settings: string;
    };
    app: {
        title: string;
        tagline: string;
        description: string;
        footer_desc: string;
        footer_rights: string;
    };
    settings: {
        title: string;
        account: string;
        about: string;
        language: string;
        haptic: string;
        report: string;
        support: string;
        logout: string;
        choose_language: string;
        report_header: string;
        report_desc: string;
        report_placeholder: string;
        upload_screenshot: string;
        send_report: string;
        support_header: string;
        terms: string;
        privacy: string;
        guidelines: string;
        blog: string;
        feedback: string;
        about_header: string;
        team: string;
        lead: string;
        developer: string;
    };
}

const dictionaries: Record<Language, Translations> = {
    English: {
        nav: { encode: 'Encode', decode: 'Decode', compare: 'Compare', settings: 'Settings' },
        app: {
            title: 'GhostByte',
            tagline: 'Secrets Hidden in Plain Sight',
            description: 'Professional-grade steganography tools for the modern age. Encode messages, extract payloads, and analyze visual integrity with pixel-perfect precision.',
            footer_desc: 'GhostByte uses LSB (Least Significant Bit) steganography which is nearly impossible for the human eye to detect.',
            footer_rights: '© 2024 GhostByte Laboratory // Verified Encryption Core // v1.0.4-PRO'
        },
        settings: {
            title: 'Settings',
            account: 'Account',
            about: 'About GhostByte',
            language: 'Language',
            haptic: 'Haptic Feedback',
            report: 'Report a problem',
            support: 'Support',
            logout: 'Log out',
            choose_language: 'Choose Language',
            report_header: 'Report a problem',
            report_desc: 'Thanks for reporting a problem! As a reminder, this is for UI feedback only.',
            report_placeholder: 'Please tell us more about the problem you encountered ...',
            upload_screenshot: 'Upload Screenshot',
            send_report: 'Send Report',
            support_header: 'Support',
            terms: 'Terms of Service',
            privacy: 'Privacy Policy',
            guidelines: 'Community Guidelines',
            blog: 'Blog',
            feedback: 'Leave us feedback',
            about_header: 'About GhostByte',
            team: 'Core Team',
            lead: 'Project Lead',
            developer: 'Core Developer'
        }
    },
    Hindi: {
        nav: { encode: 'एनकोड', decode: 'डिकोड', compare: 'तुलना', settings: 'सेटिंग्स' },
        app: {
            title: 'GhostByte', // Names typically stay same or transliterated
            tagline: 'रहस्य जो सबकी नज़रों में छिपे हैं',
            description: 'आधुनिक युग के लिए पेशेवर स्टेनोग्राफी उपकरण। संदेशों को एनकोड करें, पेलोड निकालें, और सटीक दृश्य अखंडता का विश्लेषण करें।',
            footer_desc: 'घोस्टबाइट LSB (लीस्ट सिग्निफिकेंट बिट) स्टेनोग्राफी का उपयोग करता है जिसे मानव नेत्र द्वारा पता लगाना लगभग असंभव है।',
            footer_rights: '© 2024 घोस्टबाइट लेबोरेटरी // सत्यापित एन्क्रिप्शन कोर'
        },
        settings: {
            title: 'सेटिंग्स',
            account: 'खाता',
            about: 'GhostByte के बारे में',
            language: 'भाषा',
            haptic: 'हैप्टिक फीडबैक',
            report: 'समस्या की रिपोर्ट करें',
            support: 'सहायता',
            logout: 'लॉग आउट',
            choose_language: 'भाषा चुनें',
            report_header: 'समस्या की रिपोर्ट करें',
            report_desc: 'समस्या की रिपोर्ट करने के लिए धन्यवाद! यह केवल UI प्रतिक्रिया के लिए है।',
            report_placeholder: 'कृपया हमें उस समस्या के बारे में और बताएं जिसका आपने सामना किया...',
            upload_screenshot: 'स्क्रीनशॉट अपलोड करें',
            send_report: 'रिपोर्ट भेजें',
            support_header: 'सहायता',
            terms: 'सेवा की शर्तें',
            privacy: 'गोपनीयता नीति',
            guidelines: 'सामुदायिक दिशानिर्देश',
            blog: 'ब्लॉग',
            feedback: 'प्रतिक्रिया दें',
            about_header: 'GhostByte के बारे में',
            team: 'कोर टीम',
            lead: 'प्रोजेक्ट लीड',
            developer: 'कोर डेवलपर'
        }
    },
    Kannada: {
        nav: { encode: 'ಎನ್ಕೋಡ್', decode: 'ಡಿಕೋಡ್', compare: 'ಹೋಲಿಕೆ', settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು' },
        app: {
            title: 'GhostByte',
            tagline: 'ರಹಸ್ಯಗಳು ಕಣ್ಣಮುಂದೆಯೇ ಅಡಗಿವೆ',
            description: 'ಆಧುನಿಕ ಯುಗಕ್ಕಾಗಿ ವೃತ್ತಿಪರ ಸ್ಟೆಗಾನೋಗ್ರಫಿ ಉಪಕರಣಗಳು. ಸಂದೇಶಗಳನ್ನು ಎನ್ಕೋಡ್ ಮಾಡಿ ಮತ್ತು ನಿಖರತೆಯೊಂದಿಗೆ ದೃಶ್ಯ ಸಮಗ್ರತೆಯನ್ನು ವಿಶ್ಲೇಷಿಸಿ.',
            footer_desc: 'ಘೋಸ್ಟ್ ಬೈಟ್ LSB ಸ್ಟೆಗಾನೋಗ್ರಫಿಯನ್ನು ಬಳಸುತ್ತದೆ, ಇದನ್ನು ಮಾನವ ಕಣ್ಣಿನಿಂದ ಪತ್ತೆಹಚ್ಚುವುದು ಅಸಾಧ್ಯ.',
            footer_rights: '© 2024 ಘೋಸ್ಟ್ ಬೈಟ್ ಲ್ಯಾಬೊರೇಟರಿ // ಪರಿಶೀಲಿಸಿದ ಎನ್‌ಕ್ರಿಪ್ಶನ್ ಕೋರ್'
        },
        settings: {
            title: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
            account: 'ಖಾತೆ',
            about: 'GhostByte ಬಗ್ಗೆ',
            language: 'ಭಾಷೆ',
            haptic: 'ಹ್ಯಾಪ್ಟಿಕ್ ಪ್ರತಿಕ್ರಿಯೆ',
            report: 'ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡಿ',
            support: 'ಬೆಂಬಲ',
            logout: 'ಲಾಗ್ ಔಟ್',
            choose_language: 'ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
            report_header: 'ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡಿ',
            report_desc: 'ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು! ಇದು UI ಪ್ರತಿಕ್ರಿಯೆಗಾಗಿ ಮಾತ್ರ.',
            report_placeholder: 'ನೀವು ಎದುರಿಸಿದ ಸಮಸ್ಯೆಯ ಬಗ್ಗೆ ಹೆಚ್ಚಿಗೆ ತಿಳಿಸಿ...',
            upload_screenshot: 'ಸ್ಕ್ರೀನ್‌ಶಾಟ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
            send_report: 'ವರದಿಯನ್ನು ಕಳುಹಿಸಿ',
            support_header: 'ಬೆಂಬಲ',
            terms: 'ಸೇವಾ ನಿಯಮಗಳು',
            privacy: 'ಗೌಪ್ಯತಾ ನೀತಿ',
            guidelines: 'ಸಮುದಾಯ ಮಾರ್ಗಸೂಚಿಗಳು',
            blog: 'ಬ್ಲಾಗ್',
            feedback: 'ಪ್ರತಿಕ್ರಿಯೆ ನೀಡಿ',
            about_header: 'GhostByte ಬಗ್ಗೆ',
            team: 'ಕೋರ್ ತಂಡ',
            lead: 'ಪ್ರಾಜೆಕ್ಟ್ ಲೀಡ್',
            developer: 'ಕೋರ್ ಡೆವಲಪರ್'
        }
    },
    Spanish: {
        nav: { encode: 'Codificar', decode: 'Decofidicar', compare: 'Comparar', settings: 'Ajustes' },
        app: {
            title: 'GhostByte',
            tagline: 'Secretos Ocultos a Plena Vista',
            description: 'Herramientas de esteganografía profesional para la era moderna. Codifique mensajes, extraiga cargas útiles y analice la integridad visual con precisión milimétrica.',
            footer_desc: 'GhostByte utiliza esteganografía LSB, que es casi imposible de detectar para el ojo humano.',
            footer_rights: '© 2024 Laboratorio GhostByte // Núcleo de Encriptación Verificado'
        },
        settings: {
            title: 'Ajustes',
            account: 'Cuenta',
            about: 'Sobre GhostByte',
            language: 'Idioma',
            haptic: 'Respuesta Háptica',
            report: 'Reportar un problema',
            support: 'Soporte',
            logout: 'Cerrar sesión',
            choose_language: 'Elegir Idioma',
            report_header: 'Reportar un problema',
            report_desc: '¡Gracias por reportar un problema! Esto es solo para comentarios sobre la interfaz.',
            report_placeholder: 'Cuéntanos más sobre el problema que encontraste...',
            upload_screenshot: 'Subir Captura',
            send_report: 'Enviar Reporte',
            support_header: 'Soporte',
            terms: 'Términos de Servicio',
            privacy: 'Política de Privacidad',
            guidelines: 'Pautas de la Comunidad',
            blog: 'Blog',
            feedback: 'Danos tu opinión',
            about_header: 'Sobre GhostByte',
            team: 'Equipo Principal',
            lead: 'Líder del Proyecto',
            developer: 'Desarrollador Principal'
        }
    },
    French: {
        nav: { encode: 'Encoder', decode: 'Décoder', compare: 'Comparer', settings: 'Paramètres' },
        app: {
            title: 'GhostByte',
            tagline: 'Secrets Cachés à la vue de tous',
            description: 'Outils de stéganographie professionnels pour l\'ère moderne. Encodez des messages, extrayez des données et analysez l\'intégrité visuelle avec précision.',
            footer_desc: 'GhostByte utilise la stéganographie LSB qui est presque impossible à détecter à l\'œil nu.',
            footer_rights: '© 2024 Laboratoire GhostByte // Noyau de Chiffrement Vérifié'
        },
        settings: {
            title: 'Paramètres',
            account: 'Compte',
            about: 'À propos de GhostByte',
            language: 'Langue',
            haptic: 'Retour Haptique',
            report: 'Signaler un problème',
            support: 'Support',
            logout: 'Se déconnecter',
            choose_language: 'Choisir la langue',
            report_header: 'Signaler un problème',
            report_desc: 'Merci de signaler un problème ! Ceci concerne uniquement les retours sur l\'interface.',
            report_placeholder: 'Veuillez nous en dire plus sur le problème rencontré...',
            upload_screenshot: 'Télécharger une capture',
            send_report: 'Envoyer le rapport',
            support_header: 'Support',
            terms: 'Conditions d\'utilisation',
            privacy: 'Politique de confidentialité',
            guidelines: 'Directives communautaires',
            blog: 'Blog',
            feedback: 'Laissez-nous vos commentaires',
            about_header: 'À propos de GhostByte',
            team: 'Équipe Principale',
            lead: 'Chef de Projet',
            developer: 'Développeur Principal'
        }
    }
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('English');

    const value = {
        language,
        setLanguage,
        t: dictionaries[language]
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
