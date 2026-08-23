import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'English' | 'Hindi' | 'Kannada' | 'Spanish' | 'French';

export interface Translations {
    nav: {
        home: string;
        encode: string;
        decode: string;
        compare: string;
        forensics: string;
        settings: string;
        zero_server: string;
        aes_badge: string;
        lsb_badge: string;
    };
    app: {
        title: string;
        tagline: string;
        description: string;
        logo_alt: string;
        footer_desc: string;
        footer_tip: string;
        footer_rights: string;
    };
    encoder: {
        title: string;
        desc: string;
        badge: string;
        step1: string;
        dropzone_title: string;
        dropzone_hint: string;
        dropzone_text: string;
        dropzone_browse: string;
        dropzone_support: string;
        change_image: string;
        remove_image: string;
        lossless_ingested: string;
        max_capacity: string;
        step2: string;
        tab_text: string;
        tab_file: string;
        text_placeholder: string;
        files_dropzone_title: string;
        files_dropzone_hint: string;
        queued_files: string;
        clear_all: string;
        ghostvault_container: string;
        step3: string;
        password_placeholder: string;
        generate_key: string;
        entropy_label: string;
        entropy_weak: string;
        entropy_medium: string;
        entropy_strong: string;
        button: string;
        encoding_button: string;
        processing: string;
        capacity: string;
        success: string;
        success_desc: string;
        png_warning: string;
        social_warning: string;
        download: string;
        reset: string;
        lossless_notice: string;
        jpg_trap_title: string;
        jpg_trap_desc: string;
        strength_weak: string;
        strength_medium: string;
        strength_strong: string;
        message_placeholder: string;
    };
    decoder: {
        title: string;
        desc: string;
        badge: string;
        step1: string;
        dropzone_title: string;
        dropzone_hint: string;
        dropzone_text: string;
        dropzone_browse: string;
        dropzone_support: string;
        change_image: string;
        remove_image: string;
        carrier_loaded: string;
        ready_to_decode: string;
        step2: string;
        password_placeholder: string;
        button: string;
        button_scanning: string;
        processing: string;
        success: string;
        success_desc: string;
        decoded_header: string;
        no_text: string;
        data_size: string;
        download: string;
        extraction_tip: string;
        copy_button: string;
        copy_success: string;
        save_file: string;
        save_all_files: string;
        extracted_files_count: string;
        raw_binary: string;
        save_binary: string;
    };
    comparator: {
        title: string;
        desc: string;
        badge: string;
        original_label: string;
        modified_label: string;
        dropzone_hint: string;
        browse_button: string;
        change_image: string;
        button: string;
        scanning: string;
        mse_title: string;
        mse_hint: string;
        mse_desc: string;
        psnr_title: string;
        psnr_hint: string;
        psnr_desc: string;
        rating_title: string;
        rating_hint: string;
        rating_desc: string;
        rating_exceptional: string;
        rating_high: string;
        rating_good: string;
        rating_noticeable: string;
        slider_title: string;
        slider_hint: string;
        legend_original: string;
        legend_heatmap: string;
        bitplane_title: string;
        bitplane_desc: string;
        target_label: string;
        bitplane_plane: string;
        bitplane_lsb: string;
        bitplane_msb: string;
        bitplane_extracting: string;
        bitplane_analysis: string;
        forensic_header: string;
        original_legend: string;
        diff_legend: string;
        heatmap_label: string;
        original_source_label: string;
        slider_tip: string;
        visualizer_mode: string;
        view_mode_slider: string;
        view_mode_bitplane: string;
        bitplane_label: string;
        bitplane_no_image: string;
        bitplane_tip: string;
    };
    settings: {
        title: string;
        subtitle: string;
        about: string;
        language: string;
        haptic: string;
        support: string;
        logout: string;
        choose_language: string;
        support_header: string;
        terms: string;
        terms_desc: string;
        privacy: string;
        privacy_desc: string;
        guidelines: string;
        guidelines_desc: string;
        blog: string;
        blog_desc: string;
        feedback: string;
        feedback_desc: string;
        about_header: string;
        team: string;
        lead: string;
        developer: string;
        hacker_mode: string;
        changelog_title: string;
        account: string;
        demos: string;
        demos_desc: string;
        whitepaper: string;
        whitepaper_desc: string;
        back: string;
        feedback_submit: string;
        feedback_placeholder: string;
        feedback_thanks: string;
    };
}

export const dictionaries: Record<Language, Translations> = {
    English: {
        nav: {
            home: 'Home',
            encode: 'Encode',
            decode: 'Decode',
            compare: 'Compare',
            forensics: 'Forensics',
            settings: 'Settings',
            zero_server: 'Zero-Server',
            aes_badge: 'AES-GCM-256',
            lsb_badge: 'LSB4 Spatial'
        },
        app: {
            title: 'QuietSend',
            tagline: 'Secrets Hidden in Plain Sight',
            description: 'Professional-grade steganography tools for the modern age. Encode messages, extract payloads, and analyze visual integrity with pixel-perfect precision.',
            logo_alt: 'QuietSend Logo',
            footer_desc: 'QuietSend uses LSB (Least Significant Bit) steganography which is nearly impossible for the human eye to detect.',
            footer_tip: 'Remember to use lossless formats (like PNG) for sharing encoded files to avoid compression artifacts that destroy hidden data.',
            footer_rights: '© 2026 QuietSend Laboratory // Verified Zero-Server Enclave // v3.0-PRO'
        },
        encoder: {
            title: 'Steganographic Carrier Studio',
            desc: 'Conceal confidential messages, documents & multi-file archives imperceptibly inside lossless photo carriers with authenticated AES-GCM-256 encryption.',
            badge: 'MILITARY-GRADE LSB4 + AES-GCM-256 (600K PBKDF2)',
            step1: 'Select Carrier Image',
            dropzone_title: 'Drop Cover Image or Select from Storage',
            dropzone_hint: 'Supports PNG, JPG, WebP, BMP, TIFF photos from your device',
            dropzone_text: 'Drag & drop image or browse files',
            dropzone_browse: 'browse',
            dropzone_support: 'Supports PNG, JPG, WebP, BMP, TIFF',
            change_image: 'Change Image',
            remove_image: 'Remove Image',
            lossless_ingested: 'Lossless Cover Ingested',
            max_capacity: 'Max Payload Capacity',
            step2: 'Prepare Payload',
            tab_text: 'Text Secret',
            tab_file: 'Multi-File Vault',
            text_placeholder: 'Enter secret confidential message to embed...',
            files_dropzone_title: 'Drag & drop secret files or click to add',
            files_dropzone_hint: 'Supports any file type (.pdf, .zip, .exe, .mp3, etc.)',
            queued_files: 'Queued Secret Files',
            clear_all: 'Clear All',
            ghostvault_container: 'GhostVault Multi-File Container',
            step3: 'Cryptographic Passphrase (AES-GCM-256)',
            password_placeholder: 'Enter encryption passphrase (optional)',
            generate_key: 'Generate',
            entropy_label: 'Passphrase Entropy',
            entropy_weak: 'Weak Passphrase',
            entropy_medium: 'Moderate Security',
            entropy_strong: 'Cryptographically Strong',
            button: 'Inject Secret Data & Generate Stego Image (LSB4)',
            encoding_button: 'Embedding Encrypted Payload (LSB4)...',
            processing: 'Injecting...',
            capacity: 'Available Capacity',
            success: 'Stego Image Successfully Generated',
            success_desc: 'Carrier output generated with zero visual degradation. Safe for distribution over uncompressed channels.',
            png_warning: 'Transmission: Use PNG or BMP for distribution. JPG will destroy the payload.',
            social_warning: 'Critical: Do not share via WhatsApp/Messenger. Use Email or Drive for bit-level integrity.',
            download: 'Download Lossless PNG',
            reset: 'Reset All',
            lossless_notice: 'Lossless PNG Generated · Safe for private distribution over uncompressed channels',
            jpg_trap_title: 'Carrier Conversion',
            jpg_trap_desc: 'JPG detected. Converting to lossless PNG to preserve data integrity.',
            strength_weak: 'Vulnerable',
            strength_medium: 'Standard',
            strength_strong: 'Quiet-Grade',
            message_placeholder: 'Type your secret mission details here...'
        },
        decoder: {
            title: 'Forensic Extractor & Bitstream Parser',
            desc: 'Extract and decrypt hidden confidential payloads from lossless carriers with bit-level precision.',
            badge: 'BITSTREAM PARSER + PBKDF2 (600K ITERS)',
            step1: 'Select Carrier File',
            dropzone_title: 'Drop Steganographic Image Here or Browse Gallery',
            dropzone_hint: 'Supports lossless PNG, BMP, TIFF photos from your device',
            dropzone_text: 'Drop Steganographic Image Here or Browse Gallery',
            dropzone_browse: 'browse',
            dropzone_support: 'Lossless PNG, BMP, and TIFF files contain valid payloads',
            change_image: 'Change Image',
            remove_image: 'Remove Carrier',
            carrier_loaded: 'Carrier loaded · Ready for extraction',
            ready_to_decode: 'Ready to decode bitstream',
            step2: 'Enter Passphrase & Decrypt',
            password_placeholder: 'Enter secret passphrase (leave empty if unencrypted)',
            button: 'Extract & Decrypt Payload',
            button_scanning: 'Decrypting Bitstream (600K PBKDF2)...',
            processing: 'Extracting...',
            success: 'Payload Successfully Extracted!',
            success_desc: 'The hidden secret has been successfully reconstructed.',
            decoded_header: 'Decoded Data',
            no_text: 'Payload contains binary/non-text data.',
            data_size: 'Detected data size:',
            download: 'Save File',
            extraction_tip: 'Signal Check: If extraction fails, verify that the file was not compressed by social media platforms.',
            copy_button: 'Copy Text Payload',
            copy_success: 'Copied to Clipboard!',
            save_file: 'Save File',
            save_all_files: 'Save All Files (Sequential)',
            extracted_files_count: 'Extracted files from GhostVault archive',
            raw_binary: 'Raw Binary Bytes',
            save_binary: 'Save Extracted Binary (.bin)'
        },
        comparator: {
            title: 'Forensic Noise & Heatmap Analyzer',
            desc: 'Perform pixel-level differential analysis, calculate PSNR & MSE stealth metrics, and inspect 8-level bit-plane noise distributions.',
            badge: 'FORENSIC NOISE & HEATMAP ANALYZER',
            original_label: 'Original Cover Image',
            modified_label: 'Steganographic / Encoded Image',
            dropzone_hint: 'Drop cover image or select from gallery',
            browse_button: 'Browse Gallery / Files',
            change_image: 'Change Image',
            button: 'Run Forensic Comparative Analysis',
            scanning: 'Analyzing Forensic Differential...',
            mse_title: 'Mean Squared Error (MSE)',
            mse_hint: 'Target: < 0.05 (Lower is better)',
            mse_desc: 'Average squared difference between pixels.',
            psnr_title: 'Peak SNR (PSNR)',
            psnr_hint: 'Human Perception Limit: > 36 dB',
            psnr_desc: 'Higher value means better invisibility.',
            rating_title: 'Stealth Evaluation',
            rating_hint: 'Empirical Quality Index',
            rating_desc: 'Overall assessment of the steganographic blend.',
            rating_exceptional: 'Exceptional Imperceptibility',
            rating_high: 'High Stealth (LSB4 Standard)',
            rating_good: 'Good Quality',
            rating_noticeable: 'Detectable Artifacts',
            slider_title: 'Interactive Dual-Canvas Heatmap Split',
            slider_hint: 'Drag slider handle to compare differences',
            legend_original: 'ORIGINAL',
            legend_heatmap: 'HEATMAP (DIFFERENCE)',
            bitplane_title: '8-Level Bit Plane Forensic Slicer',
            bitplane_desc: 'Inspect raw bit-planes to audit spatial noise entropy distribution across RGB channels.',
            target_label: 'Target',
            bitplane_plane: 'Plane',
            bitplane_lsb: '(LSB)',
            bitplane_msb: '(MSB)',
            bitplane_extracting: 'Extracting Bit Plane...',
            bitplane_analysis: 'Bit Plane 0 (LSB) Analysis: AES-GCM-256 encrypted payloads render as high-entropy pseudorandom white noise, statistically and visually indistinguishable from natural camera ISO sensor fluctuations.',
            forensic_header: 'Bit-Map Comparison',
            original_legend: 'Original Source',
            diff_legend: 'Injected Bits',
            heatmap_label: 'Forensic Map',
            original_source_label: 'Source',
            slider_tip: 'Slide to reveal the invisible bridge between source and stealth.',
            visualizer_mode: 'Bit-Plane Visualizer',
            view_mode_slider: 'Comparison Slider',
            view_mode_bitplane: 'Bit-Plane Forensic',
            bitplane_label: 'Layer Bit-Plane',
            bitplane_no_image: 'Compare images first to activate forensic layer analysis.',
            bitplane_tip: 'Lower bit-planes (0-2) often contain steganographic noise or hidden payloads.'
        },
        settings: {
            title: 'Settings & Security Whitepaper',
            subtitle: 'System telemetry, cryptographic specs & zero-server-retention policy',
            about: 'About Laboratory',
            language: 'Language & Localization',
            haptic: 'Haptic Feedback',
            support: 'Support Hub',
            logout: 'Log out',
            choose_language: 'Select Protocol Language',
            support_header: 'Support',
            terms: 'Terms of Service & Usage Protocols',
            terms_desc: 'Zero-server-retention policy and cryptographic disclaimers',
            privacy: 'Privacy & Data Integrity Policy',
            privacy_desc: '100% Client-Side RAM execution transparency report',
            guidelines: 'Security & Operational Guidelines',
            guidelines_desc: 'Best practices for impenetrable steganographic transmissions',
            blog: 'Engineering Intel & Whitepapers',
            blog_desc: 'Deep-dive cryptographic articles and spatial noise analysis',
            feedback: 'Send Feedback & Bug Intel',
            feedback_desc: 'Report vulnerabilities, feedback or cryptographic suggestions',
            about_header: 'About QuietSend',
            team: 'Core Team',
            lead: 'Project Lead',
            developer: 'Core Developer',
            hacker_mode: 'Execution Mode: Tactical Terminal',
            changelog_title: 'Changelog: Evolution',
            account: 'Account & Device Telemetry',
            demos: 'Video Guided Walkthroughs',
            demos_desc: 'Step-by-step masterclasses on steganographic workflows',
            whitepaper: 'Security Whitepaper & Architecture',
            whitepaper_desc: 'Detailed cryptographic specifications, threat models & algorithms',
            back: 'Back to Settings',
            feedback_submit: 'Submit Intel Report',
            feedback_placeholder: 'Type your technical feedback, security findings or feature requests...',
            feedback_thanks: 'Thank you for your feedback! Your message has been noted.'
        }
    },

    Hindi: {
        nav: {
            home: 'होम',
            encode: 'एनकोड',
            decode: 'डिकोड',
            compare: 'तुलना',
            forensics: 'फोरेंसिक',
            settings: 'सेटिंग्स',
            zero_server: 'शून्य-सर्वर',
            aes_badge: 'AES-GCM-256',
            lsb_badge: 'LSB4 स्थानिक'
        },
        app: {
            title: 'QuietSend',
            tagline: 'रहस्य जो सबकी नज़रों में छिपे हैं',
            description: 'आधुनिक युग के लिए पेशेवर स्टेनोग्राफी उपकरण। संदेशों को एनकोड करें, पेलोड निकालें, और सटीक दृश्य अखंडता का विश्लेषण करें।',
            logo_alt: 'QuietSend लोगो',
            footer_desc: 'QuietSend LSB (लीस्ट सिग्निफिकेंट बिट) स्टेनोग्राफी का उपयोग करता है जिसे मानव नेत्र द्वारा पता लगाना लगभग असंभव है।',
            footer_tip: 'छिपे हुए डेटा को नष्ट करने वाली संपीड़न कलाकृतियों से बचने के लिए एन्कोडेड फ़ाइलों को साझा करने के लिए दोषरहित प्रारूपों (जैसे PNG) का उपयोग करना याद रखें।',
            footer_rights: '© 2026 QuietSend लेबोरेटरी // सत्यापित एन्क्रिप्शन कोर // v3.0-PRO'
        },
        encoder: {
            title: 'स्टैगनोग्राफिक कैरियर स्टूडियो',
            desc: 'सत्यापित AES-GCM-256 एन्क्रिप्शन के साथ दोषरहित फ़ोटो के अंदर गोपनीय संदेशों, दस्तावेज़ों और मल्टी-फ़ाइल अभिलेखागार को छुपाएं।',
            badge: 'सैन्य-ग्रेड LSB4 + AES-GCM-256 (600K PBKDF2)',
            step1: 'वाहक छवि चुनें',
            dropzone_title: 'कवर छवि खींचें या स्टोरेज से चुनें',
            dropzone_hint: 'आपके डिवाइस से PNG, JPG, WebP, BMP, TIFF फ़ोटो का समर्थन करता है',
            dropzone_text: 'छवि को खींचें और छोड़ें या फ़ाइलें ब्राउज़ करें',
            dropzone_browse: 'ब्राउज़ करें',
            dropzone_support: 'PNG, JPG (PNG में परिवर्तित), BMP, TIFF का समर्थन करता है',
            change_image: 'छवि बदलें',
            remove_image: 'छवि हटाएं',
            lossless_ingested: 'दोषरहित कवर लोड हो गया',
            max_capacity: 'अधिकतम पेलोड क्षमता',
            step2: 'पेलोड तैयार करें',
            tab_text: 'गुप्त टेक्स्ट',
            tab_file: 'मल्टी-फ़ाइल वॉल्ट',
            text_placeholder: 'एम्बेड करने के लिए गुप्त गोपनीय संदेश दर्ज करें...',
            files_dropzone_title: 'गुप्त फ़ाइलें खींचें या जोड़ने के लिए क्लिक करें',
            files_dropzone_hint: 'किसी भी फ़ाइल प्रकार (.pdf, .zip, .exe, .mp3, आदि) का समर्थन करता है',
            queued_files: 'कतारबद्ध गुप्त फ़ाइलें',
            clear_all: 'सभी साफ़ करें',
            ghostvault_container: 'GhostVault मल्टी-फ़ाइल कंटेनर',
            step3: 'क्रिप्टोग्राफिक पासफ़्रेज़ (AES-GCM-256)',
            password_placeholder: 'एन्क्रिप्शन पासफ़्रेज़ दर्ज करें (वैकल्पिक)',
            generate_key: 'उत्पन्न करें',
            entropy_label: 'पासफ़्रेज़ एन्ट्रॉपी',
            entropy_weak: 'कमज़ोर पासफ़्रेज़',
            entropy_medium: 'मध्यम सुरक्षा',
            entropy_strong: 'क्रिप्टोग्राफ़िक रूप से मज़बूत',
            button: 'गुप्त डेटा इंजेक्ट करें और स्टेगो छवि बनाएं (LSB4)',
            encoding_button: 'एन्क्रिप्टेड पेलोड एम्बेड किया जा रहा है (LSB4)...',
            processing: 'इंजेक्ट किया जा रहा है...',
            capacity: 'उपलब्ध क्षमता',
            success: 'स्टेगो छवि सफलतापूर्वक बनाई गई',
            success_desc: 'शून्य दृश्य गिरावट के साथ वाहक छवि तैयार की गई। संपीड़न रहित चैनलों पर साझा करने के लिए सुरक्षित।',
            png_warning: 'ट्रांसमिशन: वितरण के लिए PNG या BMP का उपयोग करें। JPG पेलोड को नष्ट कर देगा।',
            social_warning: 'महत्वपूर्ण: व्हाट्सएप/मैसेंजर के माध्यम से साझा न करें। बिट-स्तरीय अखंडता के लिए ईमेल या ड्राइव का उपयोग करें।',
            download: 'दोषरहित PNG डाउनलोड करें',
            reset: 'रीसेट करें',
            lossless_notice: 'दोषरहित PNG जनरेट हुई · असम्पीडित चैनलों पर निजी वितरण के लिए सुरक्षित',
            jpg_trap_title: 'वाहक रूपांतरण',
            jpg_trap_desc: 'JPG का पता चला। डेटा अखंडता बनाए रखने के लिए दोषरहित PNG में परिवर्तित किया जा रहा है।',
            strength_weak: 'असुरक्षित',
            strength_medium: 'मानक',
            strength_strong: 'Quiet-ग्रेड',
            message_placeholder: 'अपने गुप्त मिशन विवरण यहाँ लिखें...'
        },
        decoder: {
            title: 'फोरेंसिक एक्सट्रैक्टर और बिटस्ट्रीम पार्सर',
            desc: 'बिट-स्तरीय सटीकता के साथ दोषरहित वाहकों से छिपे हुए गोपनीय पेलोड निकालें और डिक्रिप्ट करें।',
            badge: 'बिटस्ट्रीम पार्सर + PBKDF2 (600K पुनरावृत्तियाँ)',
            step1: 'वाहक फ़ाइल चुनें',
            dropzone_title: 'स्टैगनोग्राफिक छवि यहाँ छोड़ें या गैलरी ब्राउज़ करें',
            dropzone_hint: 'आपके डिवाइस से दोषरहित PNG, BMP, TIFF फ़ोटो का समर्थन करता है',
            dropzone_text: 'एन्कोडेड छवि यहाँ छोड़ें या गैलरी ब्राउज़ करें',
            dropzone_browse: 'ब्राउज़ करें',
            dropzone_support: 'केवल दोषरहित PNG/BMP/TIFF फ़ाइलों में मान्य पेलोड होते हैं',
            change_image: 'छवि बदलें',
            remove_image: 'वाहक हटाएं',
            carrier_loaded: 'वाहक लोड हो गया · निष्कर्षण के लिए तैयार',
            ready_to_decode: 'बिटस्ट्रीम डिकोड करने के लिए तैयार',
            step2: 'पासफ़्रेज़ दर्ज करें और डिक्रिप्ट करें',
            password_placeholder: 'गुप्त पासफ़्रेज़ दर्ज करें (यदि एन्क्रिप्ट नहीं है तो खाली छोड़ें)',
            button: 'पेलोड निकालें और डिक्रिप्ट करें',
            button_scanning: 'बिटस्ट्रीम डिक्रिप्ट की जा रही है (600K PBKDF2)...',
            processing: 'निकाला जा रहा है...',
            success: 'पेलोड सफलतापूर्वक निकाला गया!',
            success_desc: 'छिपे हुए रहस्य को सफलतापूर्वक पुनर्गठित किया गया है।',
            decoded_header: 'डिकोड किया गया डेटा',
            no_text: 'पेलोड में बाइनरी/गैर-टेक्स्ट डेटा है।',
            data_size: 'पता चला डेटा आकार:',
            download: 'फ़ाइल सहेजें',
            extraction_tip: 'सिग्नल चेक: यदि निष्कर्षण विफल हो जाता है, तो सत्यापित करें कि फ़ाइल सोशल मीडिया प्लेटफार्मों द्वारा संकुचित नहीं की गई थी।',
            copy_button: 'टेक्स्ट संदेश कॉपी करें',
            copy_success: 'क्लिपबोर्ड पर कॉपी किया गया!',
            save_file: 'फ़ाइल सहेजें',
            save_all_files: 'सभी फ़ाइलें सहेजें (क्रमबद्ध)',
            extracted_files_count: 'GhostVault संग्रह से निकाली गई फ़ाइलें',
            raw_binary: 'कच्चे बाइनरी बाइट्स',
            save_binary: 'निकाला गया बाइनरी सहेजें (.bin)'
        },
        comparator: {
            title: 'फोरेंसिक शोर और हीटमैप विश्लेषक',
            desc: 'पिक्सेल-स्तरीय अंतर विश्लेषण करें, PSNR और MSE गोपनीयता मेट्रिक्स की गणना करें, और 8-स्तरीय बिट-प्लेन शोर वितरण का निरीक्षण करें।',
            badge: 'फोरेंसिक शोर और हीटमैप विश्लेषक',
            original_label: 'मूल कवर छवि',
            modified_label: 'स्टैगनोग्राफिक / एन्कोडेड छवि',
            dropzone_hint: 'कवर छवि छोड़ें या गैलरी से चुनें',
            browse_button: 'गैलरी / फ़ाइलें ब्राउज़ करें',
            change_image: 'छवि बदलें',
            button: 'फोरेंसिक तुलनात्मक विश्लेषण चलाएं',
            scanning: 'फोरेंसिक अंतर का विश्लेषण किया जा रहा है...',
            mse_title: 'मीन स्क्वेर्ड एरर (MSE)',
            mse_hint: 'लक्ष्य: < 0.05 (कम बेहतर है)',
            mse_desc: 'पिक्सेल के बीच औसत वर्ग अंतर।',
            psnr_title: 'पीक SNR (PSNR)',
            psnr_hint: 'मानव धारणा सीमा: > 36 dB',
            psnr_desc: 'उच्च मूल्य का मतलब बेहतर अदृश्यता है।',
            rating_title: 'गोपनीयता मूल्यांकन',
            rating_hint: 'अनुभवजन्य गुणवत्ता सूचकांक',
            rating_desc: 'स्टैगनोग्राफिक मिश्रण का समग्र मूल्यांकन।',
            rating_exceptional: 'असाधारण अदृश्यता',
            rating_high: 'उच्च गोपनीयता (LSB4 मानक)',
            rating_good: 'अच्छी गुणवत्ता',
            rating_noticeable: 'पहचानने योग्य कलाकृतियां',
            slider_title: 'इंटरैक्टिव डुअल-कैनवास हीटमैप स्प्लिट',
            slider_hint: 'अंतर की तुलना करने के लिए स्लाइडर हैंडल खींचें',
            legend_original: 'मूल',
            legend_heatmap: 'हीटमैप (अंतर)',
            bitplane_title: '8-स्तरीय बिट प्लेन फोरेंसिक स्लाइसर',
            bitplane_desc: 'RGB चैनलों में स्थानिक शोर एन्ट्रापी वितरण का ऑडिट करने के लिए कच्चे बिट-प्लेन का निरीक्षण करें।',
            target_label: 'लक्ष्य',
            bitplane_plane: 'प्लेन',
            bitplane_lsb: '(LSB)',
            bitplane_msb: '(MSB)',
            bitplane_extracting: 'बिट प्लेन निकाला जा रहा है...',
            bitplane_analysis: 'बिट प्लेन 0 (LSB) विश्लेषण: AES-GCM-256 एन्क्रिप्टेड पेलोड उच्च-एन्ट्रॉपी छद्म-यादृच्छिक सफेद शोर के रूप में प्रस्तुत होते हैं, जो प्राकृतिक कैमरा ISO सेंसर उतार-चढ़ाव से सांख्यिकीय और दृष्टिगत रूप से अप्रभेद्य हैं।',
            forensic_header: 'बिट-मैप तुलना',
            original_legend: 'मूल स्रोत',
            diff_legend: 'इंजेक्टेड बिट्स',
            heatmap_label: 'फोरेंसिक मैप',
            original_source_label: 'स्रोत',
            slider_tip: 'स्रोत और चोरी के बीच अदृश्य पुल को प्रकट करने के लिए स्लाइड करें।',
            visualizer_mode: 'बिट-प्लेन विज़ुअलाइज़र',
            view_mode_slider: 'तुलना स्लाइडर',
            view_mode_bitplane: 'बिट-प्लेन फोरेंसिक',
            bitplane_label: 'लेयर बिट-प्लेन',
            bitplane_no_image: 'फॉरेंसिक लेयर विश्लेषण सक्रिय करने के लिए पहले छवियों की तुलना करें।',
            bitplane_tip: 'निचले बिट-प्लेन (0-2) में अक्सर स्टैगनोग्राफिक शोर या छिपे हुए पेलोड होते हैं।'
        },
        settings: {
            title: 'सेटिंग्स और सुरक्षा श्वेतपत्र',
            subtitle: 'सिस्टम टेलीमेट्री, क्रिप्टोग्राफ़िक विनिर्देश और शून्य-सर्वर-प्रतिधारण नीति',
            about: 'प्रयोगशाला के बारे में',
            language: 'ट्रांसमिशन भाषा और स्थानीयकरण',
            haptic: 'हैप्टिक फीडबैक',
            support: 'सहायता केंद्र',
            logout: 'लॉग आउट',
            choose_language: 'प्रोटोकॉल भाषा चुनें',
            support_header: 'सहायता',
            terms: 'सेवा की शर्तें और उपयोग प्रोटोकॉल',
            terms_desc: 'शून्य-सर्वर-प्रतिधारण नीति और क्रिप्टोग्राफ़िक अस्वीकरण',
            privacy: 'गोपनीयता और डेटा अखंडता नीति',
            privacy_desc: '100% क्लाइंट-साइड RAM निष्पादन पारदर्शिता रिपोर्ट',
            guidelines: 'सुरक्षा और परिचालन दिशानिर्देश',
            guidelines_desc: 'अभेद्य स्टैगनोग्राफिक ट्रांसमिशन के लिए सर्वोत्तम अभ्यास',
            blog: 'इंजीनियरिंग इंटेल और श्वेतपत्र',
            blog_desc: 'गहन क्रिप्टोग्राफ़िक लेख और स्थानिक शोर विश्लेषण',
            feedback: 'प्रतिक्रिया और बग इंटेल भेजें',
            feedback_desc: 'भेद्यता, प्रतिक्रिया या क्रिप्टोग्राफ़िक सुझावों की रिपोर्ट करें',
            about_header: 'QuietSend के बारे में',
            team: 'कोर टीम',
            lead: 'प्रोजेक्ट लीड',
            developer: 'कोर डेवलपर',
            hacker_mode: 'निष्पादन मोड: सामरिक टर्मिनल',
            changelog_title: 'चेंजलॉग: विकास',
            account: 'खाता और डिवाइस टेलीमेट्री',
            demos: 'वीडियो निर्देशित वॉकथ्रू',
            demos_desc: 'स्टैगनोग्राफिक वर्कफ़्लो पर चरण-दर-चरण मास्टरक्लास',
            whitepaper: 'सुरक्षा श्वेतपत्र और वास्तुकला',
            whitepaper_desc: 'विस्तृत क्रिप्टोग्राफ़िक विनिर्देश, खतरे के मॉडल और एल्गोरिदम',
            back: 'सेटिंग्स पर वापस जाएं',
            feedback_submit: 'इंटेल रिपोर्ट जमा करें',
            feedback_placeholder: 'अपनी तकनीकी प्रतिक्रिया, सुरक्षा निष्कर्ष या सुविधा अनुरोध टाइप करें...',
            feedback_thanks: 'आपकी प्रतिक्रिया के लिए धन्यवाद! आपका संदेश नोट कर लिया गया है।'
        }
    },

    Kannada: {
        nav: {
            home: 'ಮುಖಪುಟ',
            encode: 'ಎನ್ಕೋಡ್',
            decode: 'ಡಿಕೋಡ್',
            compare: 'ಹೋಲಿಕೆ',
            forensics: 'ಫೋರೆನ್ಸಿಕ್ಸ್',
            settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
            zero_server: 'ಶೂನ್ಯ-ಸರ್ವರ್',
            aes_badge: 'AES-GCM-256',
            lsb_badge: 'LSB4 ಪ್ರಾದೇಶಿಕ'
        },
        app: {
            title: 'QuietSend',
            tagline: 'ರಹಸ್ಯಗಳು ಕಣ್ಣಮುಂದೆಯೇ ಅಡಗಿವೆ',
            description: 'ಆಧುನಿಕ ಯುಗಕ್ಕಾಗಿ ವೃತ್ತಿಪರ ಸ್ಟೆಗಾನೋಗ್ರಫಿ ಉಪಕರಣಗಳು. ಸಂದೇಶಗಳನ್ನು ಎನ್ಕೋಡ್ ಮಾಡಿ ಮತ್ತು ನಿಖರತೆಯೊಂದಿಗೆ ದೃಶ್ಯ ಸಮಗ್ರತೆಯನ್ನು ವಿಶ್ಲೇಷಿಸಿ.',
            logo_alt: 'QuietSend ಲೋಗೋ',
            footer_desc: 'QuietSend LSB ಸ್ಟೆಗಾನೋಗ್ರಫಿಯನ್ನು ಬಳಸುತ್ತದೆ, ಇದನ್ನು ಮಾನವ ಕಣ್ಣಿನಿಂದ ಪತ್ತೆಹಚ್ಚುವುದು ಅಸಾಧ್ಯ.',
            footer_tip: 'ಗುಪ್ತ ಡೇಟಾವನ್ನು ನಾಶಮಾಡುವ ಕಂಪ್ರೆಷನ್ ಕಲಾಕೃತಿಗಳನ್ನು ತಪ್ಪಿಸಲು ಎನ್ಕೋಡ್ ಮಾಡಿದ ಫೈಲ್‌ಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಲು PNG ನಂತಹ ನಷ್ಟವಿಲ್ಲದ ಸ್ವರೂಪಗಳನ್ನು ಬಳಸಲು ಮರೆಯಬೇಡಿ.',
            footer_rights: '© 2026 QuietSend ಲ್ಯಾಬೊರೇಟರಿ // ಪರಿಶೀಲಿಸಿದ ಶೂನ್ಯ-ಸರ್ವರ್ ಎನ್‌ಕ್ಲೇವ್ // v3.0-PRO'
        },
        encoder: {
            title: 'ಸ್ಟೆಗಾನೋಗ್ರಾಫಿಕ್ ಕ್ಯಾರಿಯರ್ ಸ್ಟುಡಿಯೋ',
            desc: 'ದೃಢೀಕರಿಸಿದ AES-GCM-256 ಎನ್‌ಕ್ರಿಪ್ಶನ್‌ನೊಂದಿಗೆ ನಷ್ಟವಿಲ್ಲದ ಫೋಟೋ ವಾಹಕಗಳಲ್ಲಿ ಗೌಪ್ಯ ಸಂದೇಶಗಳು, ದಾಖಲೆಗಳು ಮತ್ತು ಮಲ್ಟಿ-ಫೈಲ್ ಆರ್ಕೈವ್‌ಗಳನ್ನು ಅಡಗಿಸಿ.',
            badge: 'ಮಿಲಿಟರಿ-ದರ್ಜೆಯ LSB4 + AES-GCM-256 (600K PBKDF2)',
            step1: 'ವಾಹಕ ಚಿತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ',
            dropzone_title: 'ಕವರ್ ಚಿತ್ರವನ್ನು ಎಳೆಯಿರಿ ಅಥವಾ ಸಂಗ್ರಹಣೆಯಿಂದ ಆಯ್ಕೆಮಾಡಿ',
            dropzone_hint: 'ನಿಮ್ಮ ಸಾಧನದಿಂದ PNG, JPG, WebP, BMP, TIFF ಫೋಟೋಗಳನ್ನು ಬೆಂಬಲಿಸುತ್ತದೆ',
            dropzone_text: 'ಚಿತ್ರವನ್ನು ಎಳೆಯಿರಿ ಮತ್ತು ಬಿಡಿ ಅಥವಾ ಫೈಲ್‌ಗಳನ್ನು ಬ್ರೌಸ್ ಮಾಡಿ',
            dropzone_browse: 'ಬ್ರೌಸ್ ಮಾಡಿ',
            dropzone_support: 'PNG, JPG, WebP, BMP, TIFF ಬೆಂಬಲಿಸುತ್ತದೆ',
            change_image: 'ಚಿತ್ರ ಬದಲಾಯಿಸಿ',
            remove_image: 'ಚಿತ್ರ ತೆಗೆದುಹಾಕಿ',
            lossless_ingested: 'ನಷ್ಟವಿಲ್ಲದ ಕವರ್ ಲೋಡ್ ಆಗಿದೆ',
            max_capacity: 'ಗರಿಷ್ಠ ಪೇಲೋಡ್ ಸಾಮರ್ಥ್ಯ',
            step2: 'ಪೇಲೋಡ್ ಸಿದ್ಧಪಡಿಸಿ',
            tab_text: 'ಗುಪ್ತ ಪಠ್ಯ',
            tab_file: 'ಮಲ್ಟಿ-ಫೈಲ್ ವಾಲ್ಟ್',
            text_placeholder: 'ಎಂಬೆಡ್ ಮಾಡಲು ರಹಸ್ಯ ಗೌಪ್ಯ ಸಂದೇಶವನ್ನು ನಮೂದಿಸಿ...',
            files_dropzone_title: 'ರಹಸ್ಯ ಫೈಲ್‌ಗಳನ್ನು ಎಳೆಯಿರಿ ಅಥವಾ ಸೇರಿಸಲು ಕ್ಲಿಕ್ ಮಾಡಿ',
            files_dropzone_hint: 'ಯಾವುದೇ ಫೈಲ್ ಪ್ರಕಾರವನ್ನು (.pdf, .zip, .exe, .mp3, ಇತ್ಯಾದಿ) ಬೆಂಬಲಿಸುತ್ತದೆ',
            queued_files: 'ಸರದಿಯಲ್ಲಿರುವ ರಹಸ್ಯ ಫೈಲ್‌ಗಳು',
            clear_all: 'ಎಲ್ಲವನ್ನೂ ತೆರವುಗೊಳಿಸಿ',
            ghostvault_container: 'GhostVault ಮಲ್ಟಿ-ಫೈಲ್ ಕಂಟೈನರ್',
            step3: 'ಕ್ರಿಪ್ಟೋಗ್ರಾಫಿಕ್ ಪಾಸ್‌ಫ್ರೇಸ್ (AES-GCM-256)',
            password_placeholder: 'ಎನ್‌ಕ್ರಿಪ್ಶನ್ ಪಾಸ್‌ಫ್ರೇಸ್ ನಮೂದಿಸಿ (ಐಚ್ಛಿಕ)',
            generate_key: 'ರಚಿಸಿ',
            entropy_label: 'ಪಾಸ್‌ಫ್ರೇಸ್ ಎಂಟ್ರೊಪಿ',
            entropy_weak: 'ದುರ್ಬಲ ಪಾಸ್‌ಫ್ರೇಸ್',
            entropy_medium: 'ಮಧ್ಯಮ ಭದ್ರತೆ',
            entropy_strong: 'ಕ್ರಿಪ್ಟೋಗ್ರಾಫಿಕಲ್ ಆಗಿ ಪ್ರಬಲವಾಗಿದೆ',
            button: 'ರಹಸ್ಯ ಡೇಟಾವನ್ನು ಇಂಜೆಕ್ಟ್ ಮಾಡಿ ಮತ್ತು ಸ್ಟೆಗೋ ಚಿತ್ರವನ್ನು ರಚಿಸಿ (LSB4)',
            encoding_button: 'ಎನ್‌ಕ್ರಿಪ್ಟ್ ಮಾಡಿದ ಪೇಲೋಡ್ ಅನ್ನು ಎಂಬೆಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ (LSB4)...',
            processing: 'ಇಂಜೆಕ್ಟ್ ಮಾಡಲಾಗುತ್ತಿದೆ...',
            capacity: 'ಲಭ್ಯವಿರುವ ಸಾಮರ್ಥ್ಯ',
            success: 'ಸ್ಟೆಗೋ ಚಿತ್ರವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ರಚಿಸಲಾಗಿದೆ',
            success_desc: 'ಶೂನ್ಯ ದೃಶ್ಯ ಅವನತಿಯೊಂದಿಗೆ ವಾಹಕ ಚಿತ್ರ ಸಿದ್ಧವಾಗಿದೆ. ಸಂಕುಚಿತಗೊಳಿಸದ ಚಾನಲ್‌ಗಳಲ್ಲಿ ಹಂಚಿಕೊಳ್ಳಲು ಸುರಕ್ಷಿತ.',
            png_warning: 'ಟ್ರಾನ್ಸ್‌ಮಿಷನ್: ವಿತರಣೆಗಾಗಿ PNG ಅಥವಾ BMP ಬಳಸಿ. JPG ಪೇಲೋಡ್ ಅನ್ನು ನಾಶಪಡಿಸುತ್ತದೆ.',
            social_warning: 'ನಿರ್ಣಾಯಕ: ವಾಟ್ಸಾಪ್/ಮೆಸೆಂಜರ್ ಮೂಲಕ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ. ಬಿಟ್-ಮಟ್ಟದ ಸಮಗ್ರತೆಗಾಗಿ ಇಮೇಲ್ ಅಥವಾ ಡ್ರೈವ್ ಬಳಸಿ.',
            download: 'ನಷ್ಟವಿಲ್ಲದ PNG ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ',
            reset: 'ಮರುಹೊಂದಿಸಿ',
            lossless_notice: 'ನಷ್ಟವಿಲ್ಲದ PNG ರಚಿಸಲಾಗಿದೆ · ಸಂಕುಚಿತಗೊಳಿಸದ ಚಾನಲ್‌ಗಳಲ್ಲಿ ಖಾಸಗಿ ವಿತರಣೆಗೆ ಸುರಕ್ಷಿತ',
            jpg_trap_title: 'ವಾಹಕ ಪರಿವರ್ತನೆ',
            jpg_trap_desc: 'JPG ಪತ್ತೆಯಾಗಿದೆ. ಡೇಟಾ ಸಮಗ್ರತೆಯನ್ನು ಕಾಪಾಡಿಕೊಳ್ಳಲು ನಷ್ಟವಿಲ್ಲದ PNG ಗೆ ಪರಿವರ್ತಿಸಲಾಗುತ್ತಿದೆ.',
            strength_weak: 'ಅಸುರಕ್ಷಿತ',
            strength_medium: 'ಸ್ಟ್ಯಾಂಡರ್ಡ್',
            strength_strong: 'Quiet-ಗ್ರೇಡ್',
            message_placeholder: 'ನಿಮ್ಮ ರಹಸ್ಯ ಮಿಷನ್ ವಿವರಗಳನ್ನು ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ...'
        },
        decoder: {
            title: 'ಫೋರೆನ್ಸಿಕ್ ಎಕ್ಸ್‌ಟ್ರಾಕ್ಟರ್ ಮತ್ತು ಬಿಟ್‌ಸ್ಟ್ರೀಮ್ ಪಾರ್ಸರ್',
            desc: 'ಬಿಟ್-ಮಟ್ಟದ ನಿಖರತೆಯೊಂದಿಗೆ ನಷ್ಟವಿಲ್ಲದ ವಾಹಕಗಳಿಂದ ಗುಪ್ತ ಗೌಪ್ಯ ಪೇಲೋಡ್‌ಗಳನ್ನು ಹೊರತೆಗೆಯಿರಿ ಮತ್ತು ಡಿಕ್ರಿಪ್ಟ್ ಮಾಡಿ.',
            badge: 'ಬಿಟ್‌ಸ್ಟ್ರೀಮ್ ಪಾರ್ಸರ್ + PBKDF2 (600K ಆವರ್ತನೆಗಳು)',
            step1: 'ವಾಹಕ ಫೈಲ್ ಆಯ್ಕೆಮಾಡಿ',
            dropzone_title: 'ಸ್ಟೆಗಾನೋಗ್ರಾಫಿಕ್ ಚಿತ್ರವನ್ನು ಇಲ್ಲಿ ಬಿಡಿ ಅಥವಾ ಗ್ಯಾಲರಿ ಬ್ರೌಸ್ ಮಾಡಿ',
            dropzone_hint: 'ನಿಮ್ಮ ಸಾಧನದಿಂದ ನಷ್ಟವಿಲ್ಲದ PNG, BMP, TIFF ಫೋಟೋಗಳನ್ನು ಬೆಂಬಲಿಸುತ್ತದೆ',
            dropzone_text: 'ಎನ್ಕೋಡ್ ಮಾಡಿದ ಚಿತ್ರವನ್ನು ಇಲ್ಲಿ ಬಿಡಿ ಅಥವಾ ಗ್ಯಾಲರಿ ಬ್ರೌಸ್ ಮಾಡಿ',
            dropzone_browse: 'ಬ್ರೌಸ್ ಮಾಡಿ',
            dropzone_support: 'ಕೇವಲ ನಷ್ಟವಿಲ್ಲದ PNG/BMP/TIFF ಫೈಲ್‌ಗಳು ಮಾನ್ಯವಾದ ಪೇಲೋಡ್‌ಗಳನ್ನು ಹೊಂದಿರುತ್ತವೆ',
            change_image: 'ಚಿತ್ರ ಬದಲಾಯಿಸಿ',
            remove_image: 'ವಾಹಕ ತೆಗೆದುಹಾಕಿ',
            carrier_loaded: 'ವಾಹಕ ಲೋಡ್ ಆಗಿದೆ · ಹೊರತೆಗೆಯಲು ಸಿದ್ಧವಾಗಿದೆ',
            ready_to_decode: 'ಬಿಟ್‌ಸ್ಟ್ರೀಮ್ ಡಿಕೋಡ್ ಮಾಡಲು ಸಿದ್ಧವಾಗಿದೆ',
            step2: 'ಪಾಸ್‌ಫ್ರೇಸ್ ನಮೂದಿಸಿ ಮತ್ತು ಡಿಕ್ರಿಪ್ಟ್ ಮಾಡಿ',
            password_placeholder: 'ರಹಸ್ಯ ಪಾಸ್‌ಫ್ರೇಸ್ ನಮೂದಿಸಿ (ಎನ್‌ಕ್ರಿಪ್ಟ್ ಮಾಡದಿದ್ದರೆ ಖಾಲಿ ಬಿಡಿ)',
            button: 'ಪೇಲೋಡ್ ಹೊರತೆಗೆಯಿರಿ ಮತ್ತು ಡಿಕ್ರಿಪ್ಟ್ ಮಾಡಿ',
            button_scanning: 'ಬಿಟ್‌ಸ್ಟ್ರೀಮ್ ಡಿಕ್ರಿಪ್ಟ್ ಮಾಡಲಾಗುತ್ತಿದೆ (600K PBKDF2)...',
            processing: 'ಹೊರತೆಗೆಯಲಾಗುತ್ತಿದೆ...',
            success: 'ಪೇಲೋಡ್ ಯಶಸ್ವಿಯಾಗಿ ಹೊರತೆಗೆಯಲಾಗಿದೆ!',
            success_desc: 'ಗುಪ್ತ ರಹಸ್ಯವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಮರುನಿರ್ಮಾಣ ಮಾಡಲಾಗಿದೆ.',
            decoded_header: 'ಡಿಕೋಡ್ ಮಾಡಿದ ಡೇಟಾ',
            no_text: 'ಪೇಲೋಡ್ ಬೈನರಿ ಡೇಟಾವನ್ನು ಹೊಂದಿದೆ.',
            data_size: 'ಪತ್ತೆಯಾದ ಡೇಟಾ ಗಾತ್ರ:',
            download: 'ಫೈಲ್ ಉಳಿಸಿ',
            extraction_tip: 'ಸಿಗ್ನಲ್ ಚೆಕ್: ಹೊರತೆಗೆಯುವಿಕೆ ವಿಫಲವಾದರೆ, ಫೈಲ್ ಅನ್ನು ಸಾಮಾಜಿಕ ಮಾಧ್ಯಮ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್‌ಗಳು ಕುಗ್ಗಿಸಿಲ್ಲ ಎಂದು ಪರಿಶೀಲಿಸಿ.',
            copy_button: 'ಪಠ್ಯ ಸಂದೇಶ ನಕಲಿಸಿ',
            copy_success: 'ಕ್ಲಿಪ್‌ಬೋರ್ಡ್‌ಗೆ ನಕಲಿಸಲಾಗಿದೆ!',
            save_file: 'ಫೈಲ್ ಉಳಿಸಿ',
            save_all_files: 'ಎಲ್ಲಾ ಫೈಲ್‌ಗಳನ್ನು ಉಳಿಸಿ (ಕ್ರಮಬದ್ಧ)',
            extracted_files_count: 'GhostVault ಆರ್ಕೈವ್‌ನಿಂದ ಹೊರತೆಗೆಯಲಾದ ಫೈಲ್‌ಗಳು',
            raw_binary: 'ಕಚ್ಚಾ ಬೈನರಿ ಬೈಟ್‌ಗಳು',
            save_binary: 'ಹೊರತೆಗೆದ ಬೈನರಿ ಉಳಿಸಿ (.bin)'
        },
        comparator: {
            title: 'ಫೋರೆನ್ಸಿಕ್ ಶಬ್ದ ಮತ್ತು ಹೀಟ್‌ಮ್ಯಾಪ್ ವಿಶ್ಲೇಷಕ',
            desc: 'ಪಿಕ್ಸೆಲ್-ಮಟ್ಟದ ವ್ಯತ್ಯಾಸ ವಿಶ್ಲೇಷಣೆ ಮಾಡಿ, PSNR ಮತ್ತು MSE ಗೌಪ್ಯತೆ ಮೆಟ್ರಿಕ್‌ಗಳನ್ನು ಲೆಕ್ಕಹಾಕಿ ಮತ್ತು 8-ಹಂತದ ಬಿಟ್-ಪ್ಲೇನ್ ಶಬ್ದ ವಿತರಣೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.',
            badge: 'ಫೋರೆನ್ಸಿಕ್ ಶಬ್ದ ಮತ್ತು ಹೀಟ್‌ಮ್ಯಾಪ್ ವಿಶ್ಲೇಷಕ',
            original_label: 'ಮೂಲ ಕವರ್ ಚಿತ್ರ',
            modified_label: 'ಸ್ಟೆಗಾನೋಗ್ರಾಫಿಕ್ / ಎನ್‌ಕೋಡ್ ಮಾಡಿದ ಚಿತ್ರ',
            dropzone_hint: 'ಕವರ್ ಚಿತ್ರವನ್ನು ಬಿಡಿ ಅಥವಾ ಗ್ಯಾಲರಿಯಿಂದ ಆಯ್ಕೆಮಾಡಿ',
            browse_button: 'ಗ್ಯಾಲರಿ / ಫೈಲ್‌ಗಳನ್ನು ಬ್ರೌಸ್ ಮಾಡಿ',
            change_image: 'ಚಿತ್ರ ಬದಲಾಯಿಸಿ',
            button: 'ಫೋರೆನ್ಸಿಕ್ ತುಲನಾತ್ಮಕ ವಿಶ್ಲೇಷಣೆ ನಡೆಸಿ',
            scanning: 'ಫೋರೆನ್ಸಿಕ್ ವ್ಯತ್ಯಾಸವನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...',
            mse_title: 'ಮೀನ್ ಸ್ಕ್ವೇರ್ಡ್ ಎರರ್ (MSE)',
            mse_hint: 'ಗುರಿ: < 0.05 (ಕಡಿಮೆ ಇದ್ದಷ್ಟು ಉತ್ತಮ)',
            mse_desc: 'ಪಿಕ್ಸೆಲ್‌ಗಳ ನಡುವಿನ ಸರಾಸರಿ ವರ್ಗ ವ್ಯತ್ಯಾಸ.',
            psnr_title: 'ಪೀಕ್ SNR (PSNR)',
            psnr_hint: 'ಮಾನವ ಗ್ರಹಿಕೆ ಮಿತಿ: > 36 dB',
            psnr_desc: 'ಹೆಚ್ಚಿನ ಮೌಲ್ಯ ಎಂದರೆ ಉತ್ತಮ ಅದೃಶ್ಯತೆ.',
            rating_title: 'ಗೌಪ್ಯತೆ ಮೌಲ್ಯಮಾಪನ',
            rating_hint: 'ಅನುಭವಜನ್ಯ ಗುಣಮಟ್ಟ ಸೂಚ್ಯಂಕ',
            rating_desc: 'ಸ್ಟೆಗಾನೋಗ್ರಾಫಿಕ್ ಮಿಶ್ರಣದ ಒಟ್ಟಾರೆ ಮೌಲ್ಯಮಾಪನ.',
            rating_exceptional: 'ಅಸಾಧಾರಣ ಅಗೋಚರತೆ',
            rating_high: 'ಉನ್ನತ ಗೌಪ್ಯತೆ (LSB4 ಸ್ಟ್ಯಾಂಡರ್ಡ್)',
            rating_good: 'ಉತ್ತಮ ಗುಣಮಟ್ಟ',
            rating_noticeable: 'ಗುರುತಿಸಬಹುದಾದ ಕಲಾಕೃತಿಗಳು',
            slider_title: 'ಇಂಟರ್ಯಾಕ್ಟಿವ್ ಡ್ಯುಯಲ್-ಕ್ಯಾನ್ವಾಸ್ ಹೀಟ್‌ಮ್ಯಾಪ್ ಸ್ಪ್ಲಿಟ್',
            slider_hint: 'ವ್ಯತ್ಯಾಸಗಳನ್ನು ಹೋಲಿಸಲು ಸ್ಲೈಡರ್ ಹ್ಯಾಂಡಲ್ ಎಳೆಯಿರಿ',
            legend_original: 'ಮೂಲ',
            legend_heatmap: 'ಹೀಟ್‌ಮ್ಯಾಪ್ (ವ್ಯತ್ಯಾಸ)',
            bitplane_title: '8-ಹಂತದ ಬಿಟ್ ಪ್ಲೇನ್ ಫೋರೆನ್ಸಿಕ್ ಸ್ಲೈಸರ್',
            bitplane_desc: 'RGB ಚಾನೆಲ್‌ಗಳಲ್ಲಿ ಪ್ರಾದೇಶಿಕ ಶಬ್ದ ಎಂಟ್ರೊಪಿ ವಿತರಣೆಯನ್ನು ಆಡಿಟ್ ಮಾಡಲು ಕಚ್ಚಾ ಬಿಟ್-ಪ್ಲೇನ್‌ಗಳನ್ನು ಪರೀಕ್ಷಿಸಿ.',
            target_label: 'ಗುರಿ',
            bitplane_plane: 'ಪ್ಲೇನ್',
            bitplane_lsb: '(LSB)',
            bitplane_msb: '(MSB)',
            bitplane_extracting: 'ಬಿಟ್ ಪ್ಲೇನ್ ಹೊರತೆಗೆಯಲಾಗುತ್ತಿದೆ...',
            bitplane_analysis: 'ಬಿಟ್ ಪ್ಲೇನ್ 0 (LSB) ವಿಶ್ಲೇಷಣೆ: AES-GCM-256 ಎನ್‌ಕ್ರಿಪ್ಟ್ ಮಾಡಿದ ಪೇಲೋಡ್‌ಗಳು ಹೆಚ್ಚಿನ-ಎಂಟ್ರೊಪಿ ವೈಟ್ ನಾಯ್ಸ್ ಆಗಿ ಪ್ರದರ್ಶನಗೊಳ್ಳುತ್ತವೆ, ಇದು ನೈಸರ್ಗಿಕ ಕ್ಯಾಮೆರಾ ಸಂವೇದಕ ಏರಿಳಿತಗಳಿಂದ ಪ್ರತ್ಯೇಕಿಸಲು ಅಸಾಧ್ಯವಾಗಿದೆ.',
            forensic_header: 'ಬಿಟ್-ಮ್ಯಾಪ್ ಹೋಲಿಕೆ',
            original_legend: 'ಮೂಲ ಮೂಲ',
            diff_legend: 'ಇಂಜೆಕ್ಟೆಡ್ ಬಿಟ್ಸ್',
            heatmap_label: 'ಫೋರೆನ್ಸಿಕ್ ಮ್ಯಾಪ್',
            original_source_label: 'ಮೂಲ',
            slider_tip: 'ಮೂಲ ಮತ್ತು ರಹಸ್ಯದ ನಡುವಿನ ಅದೃಶ್ಯ ಸೇತುವೆಯನ್ನು ಬಹಿರಂಗಪಡಿಸಲು ಸ್ಲೈಡ್ ಮಾಡಿ.',
            visualizer_mode: 'ಬಿಟ್-ಪ್ಲೇನ್ ವಿಷ್ಯುವಲೈಸರ್',
            view_mode_slider: 'ಹೋಲಿಕೆ ಸ್ಲೈಡರ್',
            view_mode_bitplane: 'ಬಿಟ್-ಪ್ಲೇನ್ ಫೋರೆನ್ಸಿಕ್',
            bitplane_label: 'ಲೇಯರ್ ಬಿಟ್-ಪ್ಲೇನ್',
            bitplane_no_image: 'ಫೋರೆನ್ಸಿಕ್ ಲೇಯರ್ ವಿಶ್ಲೇಷಣೆಯನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಲು ಮೊದಲು ಚಿತ್ರಗಳನ್ನು ಹೋಲಿಕೆ ಮಾಡಿ.',
            bitplane_tip: 'ಕೆಳಮಟ್ಟದ ಬಿಟ್-ಪ್ಲೇನ್‌ಗಳು (0-2) ಹೆಚ್ಚಾಗಿ ಸ್ಟೆಗಾನೋಗ್ರಾಫಿಕ್ ಶಬ್ದ ಅಥವಾ ಗುಪ್ತ ಪೇಲೋಡ್‌ಗಳನ್ನು ಹೊಂದಿರುತ್ತವೆ.'
        },
        settings: {
            title: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು ಮತ್ತು ಭದ್ರತಾ ಶ್ವೇತಪತ್ರ',
            subtitle: 'ಸಿಸ್ಟಮ್ ಟೆಲಿಮೆಟ್ರಿ, ಕ್ರಿಪ್ಟೋಗ್ರಾಫಿಕ್ ವಿಶೇಷಣಗಳು ಮತ್ತು ಶೂನ್ಯ-ಸರ್ವರ್ ಧಾರಣ ನೀತಿ',
            about: 'ಪ್ರಯೋಗಾಲಯದ ಬಗ್ಗೆ',
            language: 'ಟ್ರಾನ್ಸ್‌ಮಿಷನ್ ಭಾಷೆ ಮತ್ತು ಸ್ಥಳೀಕರಣ',
            haptic: 'ಹ್ಯಾಪ್ಟಿಕ್ ಪ್ರತಿಕ್ರಿಯೆ',
            support: 'ಬೆಂಬಲ ಹಬ್',
            logout: 'ಲಾಗ್ ಔಟ್',
            choose_language: 'ಪ್ರೋಟೋಕಾಲ್ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
            support_header: 'ಬೆಂಬಲ',
            terms: 'ಸೇವಾ ನಿಯಮಗಳು ಮತ್ತು ಬಳಕೆಯ ಪ್ರೋಟೋಕಾಲ್‌ಗಳು',
            terms_desc: 'ಶೂನ್ಯ-ಸರ್ವರ್ ಧಾರಣ ನೀತಿ ಮತ್ತು ಕ್ರಿಪ್ಟೋಗ್ರಾಫಿಕ್ ಹಕ್ಕು ನಿರಾಕರಣೆಗಳು',
            privacy: 'ಗೌಪ್ಯತೆ ಮತ್ತು ಡೇಟಾ ಸಮಗ್ರತೆ ನೀತಿ',
            privacy_desc: '100% ಕ್ಲೈಂಟ್-ಸೈಡ್ RAM ಎಕ್ಸಿಕ್ಯೂಶನ್ ಪಾರದರ್ಶಕತೆ ವರದಿ',
            guidelines: 'ಭದ್ರತೆ ಮತ್ತು ಕಾರ್ಯಾಚರಣೆಯ ಮಾರ್ಗಸೂಚಿಗಳು',
            guidelines_desc: 'ಅಭೇದ್ಯ ಸ್ಟೆಗಾನೋಗ್ರಾಫಿಕ್ ಪ್ರಸರಣಗಳಿಗಾಗಿ ಉತ್ತಮ ಅಭ್ಯಾಸಗಳು',
            blog: 'ಎಂಜಿನಿಯರಿಂಗ್ ಇಂಟೆಲ್ ಮತ್ತು ಶ್ವೇತಪತ್ರಗಳು',
            blog_desc: 'ಆಳವಾದ ಕ್ರಿಪ್ಟೋಗ್ರಾಫಿಕ್ ಲೇಖನಗಳು ಮತ್ತು ಪ್ರಾದೇಶಿಕ ಶಬ್ದ ವಿಶ್ಲೇಷಣೆ',
            feedback: 'ಪ್ರತಿಕ್ರಿಯೆ ಮತ್ತು ಬಗ್ ಇಂಟೆಲ್ ಕಳುಹಿಸಿ',
            feedback_desc: 'ದುರ್ಬಲತೆಗಳು, ಪ್ರತಿಕ್ರಿಯೆ ಅಥವಾ ಕ್ರಿಪ್ಟೋಗ್ರಾಫಿಕ್ ಸಲಹೆಗಳನ್ನು ವರದಿ ಮಾಡಿ',
            about_header: 'QuietSend ಬಗ್ಗೆ',
            team: 'ಕೋರ್ ತಂಡ',
            lead: 'ಪ್ರಾಜೆಕ್ಟ್ ಲೀಡ್',
            developer: 'ಕೋರ್ ಡೆವಲಪರ್',
            hacker_mode: 'ಎಕ್ಸಿಕ್ಯೂಶನ್ ಮೋಡ್: ಯುದ್ಧತಂತ್ರದ ಟರ್ಮಿನಲ್',
            changelog_title: 'ಚೇಂಜ್‌ಲಾಗ್: ಎವಲ್ಯೂಷನ್',
            account: 'ಖಾತೆ ಮತ್ತು ಸಾಧನ ಟೆಲಿಮೆಟ್ರಿ',
            demos: 'ವೀಡಿಯೊ ಮಾರ್ಗದರ್ಶಿ ವೀಕ್ಷಣೆಗಳು',
            demos_desc: 'ಸ್ಟೆಗಾನೋಗ್ರಾಫಿಕ್ ವರ್ಕ್‌ಫ್ಲೋಗಳಲ್ಲಿ ಹಂತ-ಹಂತದ ಮಾಸ್ಟರ್‌ಕ್ಲಾಸ್‌ಗಳು',
            whitepaper: 'ಭದ್ರತಾ ಶ್ವೇತಪತ್ರ ಮತ್ತು ವಾಸ್ತುಶಿಲ್ಪ',
            whitepaper_desc: 'ವಿವರವಾದ ಕ್ರಿಪ್ಟೋಗ್ರಾಫಿಕ್ ವಿಶೇಷಣಗಳು, ಬೆದರಿಕೆ ಮಾದರಿಗಳು ಮತ್ತು ಅಲ್ಗಾರಿದಮ್‌ಗಳು',
            back: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳಿಗೆ ಹಿಂತಿರುಗಿ',
            feedback_submit: 'ಇಂಟೆಲ್ ವರದಿ ಸಲ್ಲಿಸಿ',
            feedback_placeholder: 'ನಿಮ್ಮ ತಾಂತ್ರಿಕ ಪ್ರತಿಕ್ರಿಯೆ, ಭದ್ರತಾ ಸಂಶೋಧನೆಗಳು ಅಥವಾ ವೈಶಿಷ್ಟ್ಯ ವಿನಂತಿಗಳನ್ನು ಟೈಪ್ ಮಾಡಿ...',
            feedback_thanks: 'ನಿಮ್ಮ ಪ್ರತಿಕ್ರಿಯೆಗೆ ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ಸಂದೇಶವನ್ನು ದಾಖಲಿಸಲಾಗಿದೆ.'
        }
    },

    Spanish: {
        nav: {
            home: 'Inicio',
            encode: 'Codificar',
            decode: 'Decodificar',
            compare: 'Comparar',
            forensics: 'Forense',
            settings: 'Ajustes',
            zero_server: 'Cero-Servidor',
            aes_badge: 'AES-GCM-256',
            lsb_badge: 'LSB4 Espacial'
        },
        app: {
            title: 'QuietSend',
            tagline: 'Secretos Ocultos a Plena Vista',
            description: 'Herramientas de esteganografía profesional para la era moderna. Codifique mensajes, extraiga datos y analice la integridad visual con precisión.',
            logo_alt: 'Logotipo de QuietSend',
            footer_desc: 'QuietSend utiliza esteganografía LSB, que es casi imposible de detectar para el ojo humano.',
            footer_tip: 'Recuerde utilizar formatos sin pérdidas (como PNG) para compartir archivos codificados y evitar artefactos de compresión que destruyan los datos ocultos.',
            footer_rights: '© 2026 Laboratorio QuietSend // Enclave Verificado Cero-Servidor // v3.0-PRO'
        },
        encoder: {
            title: 'Estudio de Portador Esteganográfico',
            desc: 'Oculte mensajes confidenciales, documentos y archivos comprimidos imperceptiblemente dentro de fotos sin pérdidas con cifrado autenticado AES-GCM-256.',
            badge: 'LSB4 DE GRADO MILITAR + AES-GCM-256 (600K PBKDF2)',
            step1: 'Seleccionar Imagen Portadora',
            dropzone_title: 'Suelte la imagen de portada o seleccione del almacenamiento',
            dropzone_hint: 'Admite fotos PNG, JPG, WebP, BMP, TIFF de su dispositivo',
            dropzone_text: 'Arrastre y suelte la imagen o busque archivos',
            dropzone_browse: 'buscar',
            dropzone_support: 'Soporta PNG, JPG, WebP, BMP, TIFF',
            change_image: 'Cambiar Imagen',
            remove_image: 'Eliminar Imagen',
            lossless_ingested: 'Portada Sin Pérdidas Cargada',
            max_capacity: 'Capacidad Máxima de Carga Útil',
            step2: 'Preparar Carga Útil',
            tab_text: 'Texto Secreto',
            tab_file: 'Bóveda Multi-Archivo',
            text_placeholder: 'Ingrese el mensaje secreto confidencial para incrustar...',
            files_dropzone_title: 'Arrastre archivos secretos o haga clic para agregar',
            files_dropzone_hint: 'Admite cualquier tipo de archivo (.pdf, .zip, .exe, .mp3, etc.)',
            queued_files: 'Archivos Secretos en Cola',
            clear_all: 'Borrar Todo',
            ghostvault_container: 'Contenedor Multi-Archivo GhostVault',
            step3: 'Frase de Contraseña Criptográfica (AES-GCM-256)',
            password_placeholder: 'Ingrese frase de contraseña de cifrado (opcional)',
            generate_key: 'Generar',
            entropy_label: 'Entropía de Contraseña',
            entropy_weak: 'Contraseña Débil',
            entropy_medium: 'Seguridad Moderada',
            entropy_strong: 'Criptográficamente Fuerte',
            button: 'Inyectar Datos Secretos y Generar Imagen Stego (LSB4)',
            encoding_button: 'Incrustando Carga Útil Cifrada (LSB4)...',
            processing: 'Inyectando...',
            capacity: 'Capacidad Disponible',
            success: 'Imagen Stego Generada con Éxito',
            success_desc: 'Salida de portador generada con cero degradación visual. Seguro para distribución por canales sin comprimir.',
            png_warning: 'Transmisión: Use PNG o BMP para la distribución. El JPG destruirá la carga útil.',
            social_warning: 'Crítico: No comparta vía WhatsApp/Messenger. Use Email o Drive para la integridad a nivel de bits.',
            download: 'Descargar PNG Sin Pérdidas',
            reset: 'Restablecer Todo',
            lossless_notice: 'PNG Sin Pérdidas Generado · Seguro para distribución privada sobre canales sin comprimir',
            jpg_trap_title: 'Conversión de Portador',
            jpg_trap_desc: 'JPG detectado. Convirtiendo a PNG sin pérdidas para preservar la integridad de los datos.',
            strength_weak: 'Vulnerable',
            strength_medium: 'Estándar',
            strength_strong: 'Grado Quiet',
            message_placeholder: 'Escriba los detalles de su misión secreta aquí...'
        },
        decoder: {
            title: 'Extractor Forense y Analizador de Flujo de Bits',
            desc: 'Extraiga y descifre cargas útiles confidenciales ocultas de portadores sin pérdidas con precisión a nivel de bits.',
            badge: 'ANALIZADOR DE BITS + PBKDF2 (600K ITERACIONES)',
            step1: 'Seleccionar Archivo Portador',
            dropzone_title: 'Suelte la Imagen Esteganográfica Aquí o Explore la Galería',
            dropzone_hint: 'Admite fotos PNG, BMP, TIFF sin pérdidas de su dispositivo',
            dropzone_text: 'Seleccionar imagen codificada o buscar',
            dropzone_browse: 'buscar',
            dropzone_support: 'Solo los archivos PNG/BMP/TIFF sin pérdidas contienen cargas útiles válidas',
            change_image: 'Cambiar Imagen',
            remove_image: 'Eliminar Portador',
            carrier_loaded: 'Portador cargado · Listo para extracción',
            ready_to_decode: 'Listo para decodificar flujo de bits',
            step2: 'Ingresar Frase de Contraseña y Descifrar',
            password_placeholder: 'Ingrese la frase de contraseña secreta (dejar en blanco si no está cifrada)',
            button: 'Extraer y Descifrar Carga Útil',
            button_scanning: 'Descifrando Flujo de Bits (600K PBKDF2)...',
            processing: 'Extrayendo...',
            success: '¡Carga Útil Extraída con Éxito!',
            success_desc: 'El secreto oculto ha sido reconstruido con éxito.',
            decoded_header: 'Datos Decodificados',
            no_text: 'El contenido contiene datos binarios.',
            data_size: 'Tamaño de datos detectado:',
            download: 'Guardar Archivo',
            extraction_tip: 'Verificación: Si la extracción falla, verifique que el archivo no haya sido comprimido por redes sociales.',
            copy_button: 'Copiar Mensaje de Texto',
            copy_success: '¡Copiado al Portapapeles!',
            save_file: 'Guardar Archivo',
            save_all_files: 'Guardar Todos los Archivos (Secuencial)',
            extracted_files_count: 'Archivos extraídos del archivo GhostVault',
            raw_binary: 'Bytes Binarios Crudos',
            save_binary: 'Guardar Binario Extraído (.bin)'
        },
        comparator: {
            title: 'Analizador Forense de Ruido y Mapa de Calor',
            desc: 'Realice análisis diferencial a nivel de píxel, calcule métricas de sigilo PSNR y MSE, e inspeccione distribuciones de ruido de plano de bits de 8 niveles.',
            badge: 'ANALIZADOR FORENSE DE RUIDO Y MAPA DE CALOR',
            original_label: 'Imagen de Portada Original',
            modified_label: 'Imagen Esteganográfica / Codificada',
            dropzone_hint: 'Suelte la imagen de portada o seleccione de la galería',
            browse_button: 'Explorar Galería / Archivos',
            change_image: 'Cambiar Imagen',
            button: 'Ejecutar Análisis Comparativo Forense',
            scanning: 'Analizando Diferencial Forense...',
            mse_title: 'Error Cuadrático Medio (MSE)',
            mse_hint: 'Objetivo: < 0.05 (Menor es mejor)',
            mse_desc: 'Promedio de la diferencia al cuadrado entre píxeles.',
            psnr_title: 'Relación Señal-Ruido Pico (PSNR)',
            psnr_hint: 'Límite de Percepción Humana: > 36 dB',
            psnr_desc: 'Un valor más alto significa mejor invisibilidad.',
            rating_title: 'Evaluación de Sigilo',
            rating_hint: 'Índice de Calidad Empírica',
            rating_desc: 'Evaluación general de la mezcla esteganográfica.',
            rating_exceptional: 'Imperceptibilidad Excepcional',
            rating_high: 'Alto Sigilo (Estándar LSB4)',
            rating_good: 'Buena Calidad',
            rating_noticeable: 'Artefactos Detectables',
            slider_title: 'División Interactiva de Mapa de Calor de Doble Lienzo',
            slider_hint: 'Arrastre el control deslizante para comparar diferencias',
            legend_original: 'ORIGINAL',
            legend_heatmap: 'MAPA DE CALOR (DIFERENCIA)',
            bitplane_title: 'Divisor Forense de Plano de Bits de 8 Niveles',
            bitplane_desc: 'Inspeccione los planos de bits sin procesar para auditar la distribución de entropía de ruido espacial en canales RGB.',
            target_label: 'Objetivo',
            bitplane_plane: 'Plano',
            bitplane_lsb: '(LSB)',
            bitplane_msb: '(MSB)',
            bitplane_extracting: 'Extrayendo Plano de Bits...',
            bitplane_analysis: 'Análisis de Plano de Bits 0 (LSB): Las cargas útiles cifradas con AES-GCM-256 se muestran como ruido blanco pseudoaleatorio de alta entropía, indistinguible estadística y visualmente de las fluctuaciones naturales del sensor ISO de la cámara.',
            forensic_header: 'Comparación de Mapa de Bits',
            original_legend: 'Fuente Original',
            diff_legend: 'Bits Inyectados',
            heatmap_label: 'Mapa Forense',
            original_source_label: 'Fuente',
            slider_tip: 'Deslice para revelar el puente invisible entre la fuente y el sigilo.',
            visualizer_mode: 'Visualizador de Plano de Bits',
            view_mode_slider: 'Control Deslizante de Comparación',
            view_mode_bitplane: 'Forense de Plano de Bits',
            bitplane_label: 'Plano de Bits de Capa',
            bitplane_no_image: 'Compare las imágenes primero para activar el análisis de capa forense.',
            bitplane_tip: 'Los planos de bits inferiores (0-2) a menudo contienen ruido esteganográfico o cargas útiles ocultas.'
        },
        settings: {
            title: 'Ajustes y Libro Blanco de Seguridad',
            subtitle: 'Telemetría del sistema, especificaciones criptográficas y política de cero retención en servidor',
            about: 'Sobre el Laboratorio',
            language: 'Idioma de Transmisión y Localización',
            haptic: 'Respuesta Háptica',
            support: 'Centro de Soporte',
            logout: 'Cerrar sesión',
            choose_language: 'Seleccionar Idioma del Protocolo',
            support_header: 'Soporte',
            terms: 'Términos de Servicio y Protocolos de Uso',
            terms_desc: 'Política de cero retención en servidor y descargos de responsabilidad criptográfica',
            privacy: 'Política de Privacidad e Integridad de Datos',
            privacy_desc: 'Informe de transparencia de ejecución en RAM 100% del lado del cliente',
            guidelines: 'Directrices de Seguridad y Operativas',
            guidelines_desc: 'Mejores prácticas para transmisiones esteganográficas impenetrables',
            blog: 'Intel de Ingeniería y Libros Blancos',
            blog_desc: 'Artículos criptográficos detallados y análisis de ruido espacial',
            feedback: 'Enviar Comentarios e Información sobre Errores',
            feedback_desc: 'Informar vulnerabilidades, comentarios o sugerencias criptográficas',
            about_header: 'Sobre QuietSend',
            team: 'Equipo Principal',
            lead: 'Líder del Proyecto',
            developer: 'Desarrollador Principal',
            hacker_mode: 'Modo de Ejecución: Terminal Táctico',
            changelog_title: 'Registro de Cambios: Evolución',
            account: 'Telemetría de Cuenta y Dispositivo',
            demos: 'Guías en Video Paso a Paso',
            demos_desc: 'Clases magistrales paso a paso sobre flujos de trabajo esteganográficos',
            whitepaper: 'Libro Blanco de Seguridad y Arquitectura',
            whitepaper_desc: 'Especificaciones criptográficas detalladas, modelos de amenazas y algoritmos',
            back: 'Volver a Ajustes',
            feedback_submit: 'Enviar Informe de Intel',
            feedback_placeholder: 'Escriba sus comentarios técnicos, hallazgos de seguridad o solicitudes de funciones...',
            feedback_thanks: '¡Gracias por sus comentarios! Su mensaje ha sido registrado.'
        }
    },

    French: {
        nav: {
            home: 'Accueil',
            encode: 'Encoder',
            decode: 'Décoder',
            compare: 'Comparer',
            forensics: 'Forensique',
            settings: 'Paramètres',
            zero_server: 'Zéro-Serveur',
            aes_badge: 'AES-GCM-256',
            lsb_badge: 'LSB4 Spatial'
        },
        app: {
            title: 'QuietSend',
            tagline: 'Secrets Cachés à la vue de tous',
            description: 'Outils de stéganographie professionnels pour l\'ère moderne. Encodez des messages, extrayez des données et analysez l\'intégrité visuelle.',
            logo_alt: 'Logo QuietSend',
            footer_desc: 'QuietSend utilise la stéganographie LSB qui est presque impossible à détecter à l\'œil nu.',
            footer_tip: 'N\'oubliez pas d\'utiliser des formats sans perte (comme PNG) pour partager les fichiers encodés afin d\'éviter les artefacts de compression qui détruisent les données cachées.',
            footer_rights: '© 2026 Laboratoire QuietSend // Enclave Vérifiée Zéro-Serveur // v3.0-PRO'
        },
        encoder: {
            title: 'Studio de Support Stéganographique',
            desc: 'Dissimulez des messages confidentiels, des documents et des archives multi-fichiers imperceptiblement dans des photos sans perte avec chiffrement authentifié AES-GCM-256.',
            badge: 'LSB4 DE QUALITÉ MILITAIRE + AES-GCM-256 (600K PBKDF2)',
            step1: 'Sélectionner l\'image porteuse',
            dropzone_title: 'Déposez l\'image de couverture ou sélectionnez depuis le stockage',
            dropzone_hint: 'Prend en charge les photos PNG, JPG, WebP, BMP, TIFF de votre appareil',
            dropzone_text: 'Glissez-déposez l\'image ou parcourez les fichiers',
            dropzone_browse: 'parcourir',
            dropzone_support: 'Supporte PNG, JPG, WebP, BMP, TIFF',
            change_image: 'Changer d\'image',
            remove_image: 'Supprimer l\'image',
            lossless_ingested: 'Couverture sans perte chargée',
            max_capacity: 'Capacité maximale de charge utile',
            step2: 'Préparer la charge utile',
            tab_text: 'Texte Secret',
            tab_file: 'Coffre-fort Multi-Fichiers',
            text_placeholder: 'Entrez le message secret confidentiel à intégrer...',
            files_dropzone_title: 'Glissez des fichiers secrets ou cliquez pour ajouter',
            files_dropzone_hint: 'Prend en charge tout type de fichier (.pdf, .zip, .exe, .mp3, etc.)',
            queued_files: 'Fichiers Secrets en File d\'attente',
            clear_all: 'Tout effacer',
            ghostvault_container: 'Conteneur Multi-Fichiers GhostVault',
            step3: 'Phrase Secrète Cryptographique (AES-GCM-256)',
            password_placeholder: 'Entrez la phrase secrète de chiffrement (facultatif)',
            generate_key: 'Générer',
            entropy_label: 'Entropie de la Phrase Secrète',
            entropy_weak: 'Phrase Secrète Faible',
            entropy_medium: 'Sécurité Modérée',
            entropy_strong: 'Cryptographiquement Forte',
            button: 'Injecter les Données Secrètes et Générer l\'Image Stego (LSB4)',
            encoding_button: 'Intégration de la Charge Utile Chiffrée (LSB4)...',
            processing: 'Injection...',
            capacity: 'Capacité disponible',
            success: 'Image Stego Générée avec Succès',
            success_desc: 'Sortie porteuse générée avec zéro dégradation visuelle. Sûr pour la distribution sur des canaux non compressés.',
            png_warning: 'Transmission : Utilisez PNG ou BMP pour la distribution. Le JPG détruira la charge utile.',
            social_warning: 'Critique : Ne partagez pas via WhatsApp/Messenger. Utilisez Email ou Drive pour l\'intégrité au niveau du bit.',
            download: 'Télécharger le PNG Sans Perte',
            reset: 'Tout Réinitialiser',
            lossless_notice: 'PNG Sans Perte Généré · Sûr pour la distribution privée sur des canaux non compressés',
            jpg_trap_title: 'Conversion du porteur',
            jpg_trap_desc: 'JPG détecté. Conversion en PNG sans perte pour préserver l\'intégrité des données.',
            strength_weak: 'Vulnérable',
            strength_medium: 'Standard',
            strength_strong: 'Grade Quiet',
            message_placeholder: 'Tapez les détails de votre mission secrète ici...'
        },
        decoder: {
            title: 'Extracteur Forensique et Analyseur de Flux Binaire',
            desc: 'Extrayez et déchiffrez les charges utiles confidentielles cachées des supports sans perte avec une précision au niveau du bit.',
            badge: 'ANALYSEUR DE FLUX + PBKDF2 (600K ITÉRATIONS)',
            step1: 'Sélectionner le fichier porteur',
            dropzone_title: 'Déposez l\'Image Stéganographique Ici ou Parcourez la Galerie',
            dropzone_hint: 'Prend en charge les photos PNG, BMP, TIFF sans perte de votre appareil',
            dropzone_text: 'Sélectionner l\'image encodée ou parcourir',
            dropzone_browse: 'parcourir',
            dropzone_support: 'Seuls les fichiers PNG/BMP/TIFF sans perte contiennent des charges utiles valides',
            change_image: 'Changer d\'image',
            remove_image: 'Supprimer le porteur',
            carrier_loaded: 'Porteur chargé · Prêt pour l\'extraction',
            ready_to_decode: 'Prêt à décoder le flux binaire',
            step2: 'Entrer la clé et Déchiffrer',
            password_placeholder: 'Entrez la phrase secrète (laisser vide si non chiffré)',
            button: 'Extraire et Déchiffrer la Charge Utile',
            button_scanning: 'Déchiffrement du Flux Binaire (600K PBKDF2)...',
            processing: 'Extraction...',
            success: 'Charge Utile Extraite avec Succès !',
            success_desc: 'Le secret caché a été reconstruit avec succès.',
            decoded_header: 'Données Décodées',
            no_text: 'Le contenu contient des données binaires.',
            data_size: 'Taille des données détectée :',
            download: 'Enregistrer le Fichier',
            extraction_tip: 'Vérification : Si l\'extraction échoue, vérifiez que le fichier n\'a pas été compressé par les réseaux sociaux.',
            copy_button: 'Copier le Message Texte',
            copy_success: 'Copié dans le Presse-papier !',
            save_file: 'Enregistrer le Fichier',
            save_all_files: 'Enregistrer Tous les Fichiers (Séquentiel)',
            extracted_files_count: 'Fichiers extraits de l\'archive GhostVault',
            raw_binary: 'Octets Binaires Bruts',
            save_binary: 'Enregistrer le Binaire Extrait (.bin)'
        },
        comparator: {
            title: 'Analyseur Forensique de Bruit et Carte Thermique',
            desc: 'Effectuez une analyse différentielle au niveau du pixel, calculez les métriques de discrétion PSNR et MSE, et inspectez la distribution du bruit sur 8 plans de bits.',
            badge: 'ANALYSEUR FORENSIQUE DE BRUIT ET CARTE THERMIQUE',
            original_label: 'Image de Couverture Originale',
            modified_label: 'Image Stéganographique / Encodée',
            dropzone_hint: 'Déposez l\'image de couverture ou sélectionnez depuis la galerie',
            browse_button: 'Parcourir la Galerie / Fichiers',
            change_image: 'Changer d\'image',
            button: 'Exécuter l\'Analyse Comparative Forensique',
            scanning: 'Analyse du Différentiel Forensique...',
            mse_title: 'Erreur Quadratique Moyenne (MSE)',
            mse_hint: 'Objectif : < 0.05 (Plus bas est meilleur)',
            mse_desc: 'Moyenne de la différence au carré entre les pixels.',
            psnr_title: 'Rapport Signal sur Bruit de Crête (PSNR)',
            psnr_hint: 'Limite de Perception Humaine : > 36 dB',
            psnr_desc: 'Une valeur plus élevée signifie une meilleure invisibilité.',
            rating_title: 'Évaluation de la Discrétion',
            rating_hint: 'Indice de Qualité Empirique',
            rating_desc: 'Évaluation globale du mélange stéganographique.',
            rating_exceptional: 'Imperceptibilité Exceptionnelle',
            rating_high: 'Haute Discrétion (Standard LSB4)',
            rating_good: 'Bonne Qualité',
            rating_noticeable: 'Artefacts Détectables',
            slider_title: 'Séparation Interactive de Carte Thermique à Double Toile',
            slider_hint: 'Faites glisser la poignée pour comparer les différences',
            legend_original: 'ORIGINAL',
            legend_heatmap: 'CARTE THERMIQUE (DIFFÉRENCE)',
            bitplane_title: 'Découpeur Forensique de Plan de Bits à 8 Niveaux',
            bitplane_desc: 'Inspectez les plans de bits bruts pour auditer la distribution d\'entropie du bruit spatial sur les canaux RVB.',
            target_label: 'Cible',
            bitplane_plane: 'Plan',
            bitplane_lsb: '(LSB)',
            bitplane_msb: '(MSB)',
            bitplane_extracting: 'Extraction du Plan de Bits...',
            bitplane_analysis: 'Analyse du Plan de Bits 0 (LSB) : Les charges utiles chiffrées avec AES-GCM-256 apparaissent comme un bruit blanc pseudo-aléatoire à haute entropie, statistiquement et visuellement indiscernable des fluctuations naturelles du capteur ISO de l\'appareil photo.',
            forensic_header: 'Comparaison de table de bits',
            original_legend: 'Source Originale',
            diff_legend: 'Bits injectés',
            heatmap_label: 'Carte forensique',
            original_source_label: 'Source',
            slider_tip: 'Glissez pour révéler le pont invisible entre la source et la furtivité.',
            visualizer_mode: 'Visualiseur de plan de bits',
            view_mode_slider: 'Curseur de comparaison',
            view_mode_bitplane: 'Analyse des plans de bits',
            bitplane_label: 'Plan de bits de la couche',
            bitplane_no_image: 'Comparez d\'abord les images pour activer l\'analyse de couche forensique.',
            bitplane_tip: 'Les plans de bits inférieurs (0-2) contiennent souvent du bruit stéganographique ou des charges utiles cachées.'
        },
        settings: {
            title: 'Paramètres et Livre Blanc de Sécurité',
            subtitle: 'Télémétrie du système, spécifications cryptographiques et politique de rétention zéro serveur',
            about: 'À propos du laboratoire',
            language: 'Langue de Transmission et Localisation',
            haptic: 'Retour haptique',
            support: 'Hub de support',
            logout: 'Se déconnecter',
            choose_language: 'Sélectionner la langue du protocole',
            support_header: 'Support',
            terms: 'Conditions d\'utilisation et Protocoles',
            terms_desc: 'Politique de zéro rétention sur serveur et avertissements cryptographiques',
            privacy: 'Politique de Confidentialité et d\'Intégrité des Données',
            privacy_desc: 'Rapport de transparence d\'exécution en RAM 100% côté client',
            guidelines: 'Directives de Sécurité et Opérationnelles',
            guidelines_desc: 'Meilleures pratiques pour des transmissions stéganographiques impénétrables',
            blog: 'Intel d\'Ingénierie et Livres Blancs',
            blog_desc: 'Articles cryptographiques approfondis et analyse du bruit spatial',
            feedback: 'Envoyer des Commentaires et Intel de Bugs',
            feedback_desc: 'Signaler des vulnérabilités, des retours ou des suggestions cryptographiques',
            about_header: 'À propos de QuietSend',
            team: 'Équipe Principale',
            lead: 'Chef de Projet',
            developer: 'Développeur Principal',
            hacker_mode: 'Mode d\'exécution : Terminal Tactique',
            changelog_title: 'Changelog : Évolution',
            account: 'Télémétrie du Compte et de l\'Appareil',
            demos: 'Guides Vidéo Pas à Pas',
            demos_desc: 'Masterclasses pas à pas sur les flux de travail stéganographiques',
            whitepaper: 'Livre Blanc de Sécurité et Architecture',
            whitepaper_desc: 'Spécifications cryptographiques détaillées, modèles de menaces et algorithmes',
            back: 'Retour aux Paramètres',
            feedback_submit: 'Soumettre le Rapport d\'Intel',
            feedback_placeholder: 'Tapez vos commentaires techniques, résultats de sécurité ou demandes de fonctionnalités...',
            feedback_thanks: 'Merci pour vos commentaires ! Votre message a été enregistré.'
        }
    }
};

export const LANG_OPTIONS = [
    { code: 'English', native: 'English', label: 'English' },
    { code: 'Hindi', native: 'हिन्दी', label: 'Hindi' },
    { code: 'Kannada', native: 'ಕನ್ನಡ', label: 'Kannada' },
    { code: 'Spanish', native: 'Español', label: 'Spanish' },
    { code: 'French', native: 'Français', label: 'French' },
] as const;

const codeMap: Record<string, Language> = {
    EN: 'English',
    HI: 'Hindi',
    KN: 'Kannada',
    ES: 'Spanish',
    FR: 'French',
    English: 'English',
    Hindi: 'Hindi',
    Kannada: 'Kannada',
    Spanish: 'Spanish',
    French: 'French'
};

export interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language | string) => void;
    lang: Language;
    setLang: (lang: Language | string) => void;
    t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>(() => {
        const saved = typeof window !== 'undefined' ? localStorage.getItem('quietsend_language') : null;
        if (saved && codeMap[saved]) return codeMap[saved];
        return 'English';
    });

    const setLanguage = (l: Language | string) => {
        const mapped = codeMap[l] || 'English';
        setLanguageState(mapped);
        if (typeof window !== 'undefined') {
            localStorage.setItem('quietsend_language', mapped);
        }
    };

    const value: LanguageContextType = {
        language,
        setLanguage,
        lang: language,
        setLang: setLanguage,
        t: dictionaries[language] || dictionaries.English
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

export const useLang = useLanguage;
