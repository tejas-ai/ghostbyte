import React, { useState } from 'react';
import {
    Globe,
    MessageSquare,
    LifeBuoy,
    Info,
    ChevronRight,
    ChevronLeft,
    Upload,
    Check
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

type ViewState = 'main' | 'language' | 'report' | 'support' | 'about' | 'terms' | 'privacy' | 'guidelines' | 'blog' | 'feedback' | 'blog_post';

const Settings: React.FC = () => {
    const { language, setLanguage, t } = useLanguage();
    const [activeView, setActiveView] = useState<ViewState>('main');
    const [reportText, setReportText] = useState('');
    const [feedbackText, setFeedbackText] = useState('');
    const [screenshotName, setScreenshotName] = useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const [showAttachmentModal, setShowAttachmentModal] = useState(false);

    // Blog State
    const [selectedPost, setSelectedPost] = useState<any | null>(null);

    const blogPosts = [
        // ... (posts content remains same) ...
        {
            id: 1,
            title: "Understanding LSB Steganography",
            date: "Jan 10, 2026",
            readTime: "5 min read",
            summary: "Learn how the Least Significant Bit algorithm hides data in plain sight without altering visual perception.",
            content: (
                <>
                    <p>Least Significant Bit (LSB) steganography is one of the most common and effective techniques for hiding data within digital images. It works by replacing the last bit of each pixel's color byte with a bit of the secret message.</p>
                    <h4 className="text-white font-bold mt-6 mb-2">How it works</h4>
                    <p>Digital images are made up of pixels, and each pixel is typically represented by three distinct color channels: Red, Green, and Blue (RGB). Each channel is usually 8 bits, meaning it can have a value from 0 to 255.</p>
                    <p className="mt-4">Changing the last bit (the "least significant" one) only changes the color value by 1. For example, changing a value from 200 (11001000) to 201 (11001001) is visually imperceptible to the human eye.</p>
                    <h4 className="text-white font-bold mt-6 mb-2">Why GhostByte uses it</h4>
                    <p>We use an advanced variation of LSB that distributes data across all three channels, maximizing capacity while maintaining the highest possible visual fidelity. Combined with our AES-256 encryption, your data is both hidden and secure.</p>
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
                    <h4 className="text-white font-bold mt-6 mb-2">The Problem with Encryption</h4>
                    <p>If you send an encrypted file, anyone intercepting it knows you are hiding something. In many jurisdictions, this alone can be cause for suspicion or legal trouble.</p>
                    <h4 className="text-white font-bold mt-6 mb-2">The Steganography Advantage</h4>
                    <p>Steganography hides the message inside an innocent-looking carrier file, like a vacation photo. To an observer, you are just sharing a picture.</p>
                    <p className="mt-4"><strong>GhostByte</strong> combines both: we encrypt your message first, then hide it. Even if someone suspects steganography, they still face military-grade encryption.</p>
                </>
            )
        },
        {
            id: 3,
            title: "Protecting Your Digital Privacy",
            date: "Nov 15, 2025",
            readTime: "4 min read",
            summary: "Essential tips for maintaining anonymity and data security in an increasingly connected world.",
            content: (
                <>
                    <p>In 2026, digital privacy is more than just a preference—it's a necessity. Here are three simple steps you can take today to secure your digital footprint.</p>
                    <ul className="list-disc pl-5 space-y-2 mt-4">
                        <li><strong>Use End-to-End Encryption:</strong> Always ensure your messaging apps use E2EE.</li>
                        <li><strong>Hide Sensitive Data:</strong> Don't just leave confidential files in folders. Use tools like GhostByte to conceal them within other files.</li>
                        <li><strong>Regular Audits:</strong> Check your account permissions and revoke access to apps you no longer use.</li>
                    </ul>
                </>
            )
        }
    ];

    const handleBack = () => {
        setActiveView('main');
    };

    const handleSupportBack = () => {
        setActiveView('support');
    };

    const handleLanguageSelect = (lang: any) => {
        setLanguage(lang);
        setTimeout(() => setActiveView('main'), 200);
    };

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setScreenshotName(e.target.files[0].name);
        }
    };

    const handleReportSubmit = () => {
        if (screenshotName) {
            setShowAttachmentModal(true);
        } else {
            proceedWithEmail();
        }
    };

    const proceedWithEmail = () => {
        const subject = encodeURIComponent("GhostByte Issue");
        const body = encodeURIComponent(reportText);
        window.location.href = `mailto:tejas.j.h8055@gmail.com?subject=${subject}&body=${body}`;
        setShowAttachmentModal(false);
    };

    const handleFeedbackSubmit = () => {
        const subject = encodeURIComponent("GhostByte Feedback");
        const body = encodeURIComponent(feedbackText);
        window.location.href = `mailto:tejas.j.h8055@gmail.com?subject=${subject}&body=${body}`;
    };

    const handleBlogClick = (post: any) => {
        setSelectedPost(post);
        setActiveView('blog_post');
    };

    const handleBlogBack = () => {
        setSelectedPost(null);
        setActiveView('blog');
    };

    // --- VIEWS ---

    const renderMainView = () => (
        <div className="space-y-1 animate-fade-in">
            <h2 className="text-3xl font-bold text-white mb-8 px-2">{t.settings.title}</h2>

            {/* Language */}
            <button
                onClick={() => { setActiveView('language'); }}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-900 rounded-xl transition-all duration-200 group active:scale-[0.98]"
            >
                <div className="flex items-center space-x-4">
                    <Globe className="text-gray-500 group-hover:text-blue-600 transition-colors" size={22} />
                    <span className="font-medium text-gray-200 group-hover:text-white">{t.settings.language}</span>
                </div>
                <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-500">{language}</span>
                    <ChevronRight className="text-gray-600" size={18} />
                </div>
            </button>

            {/* Report a Problem */}
            <button
                onClick={() => { setActiveView('report'); }}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-900 rounded-xl transition-all duration-200 group active:scale-[0.98]"
            >
                <div className="flex items-center space-x-4">
                    <MessageSquare className="text-gray-500 group-hover:text-blue-600 transition-colors" size={22} />
                    <span className="font-medium text-gray-200 group-hover:text-white">{t.settings.report}</span>
                </div>
                <ChevronRight className="text-gray-600" size={18} />
            </button>

            {/* Support */}
            <button
                onClick={() => { setActiveView('support'); }}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-900 rounded-xl transition-all duration-200 group active:scale-[0.98]"
            >
                <div className="flex items-center space-x-4">
                    <LifeBuoy className="text-gray-500 group-hover:text-blue-600 transition-colors" size={22} />
                    <span className="font-medium text-gray-200 group-hover:text-white">{t.settings.support}</span>
                </div>
                <ChevronRight className="text-gray-600" size={18} />
            </button>

            {/* About GhostByte */}
            <button
                onClick={() => { setActiveView('about'); }}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-900 rounded-xl transition-all duration-200 group active:scale-[0.98]"
            >
                <div className="flex items-center space-x-4">
                    <Info className="text-gray-500 group-hover:text-blue-600 transition-colors" size={22} />
                    <span className="font-medium text-gray-200 group-hover:text-white">{t.settings.about}</span>
                </div>
                <ChevronRight className="text-gray-600" size={18} />
            </button>
        </div>
    );

    const renderLanguageView = () => (
        <div className="animate-fade-in h-full">
            <div className="flex items-center mb-6 relative">
                <button onClick={handleBack} className="p-2 -ml-2 hover:bg-gray-900 rounded-full text-blue-400 active:scale-90 transition-transform">
                    <ChevronLeft size={28} />
                </button>
                <h2 className="text-xl font-bold text-white absolute left-1/2 -translate-x-1/2">{t.settings.choose_language}</h2>
            </div>
            <div className="space-y-2">
                {['English', 'Hindi', 'Kannada', 'Spanish', 'French'].map((lang) => (
                    <button
                        key={lang}
                        onClick={() => handleLanguageSelect(lang)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-900 rounded-xl transition-colors group"
                    >
                        <span className={`font-medium ${language === lang ? 'text-blue-400' : 'text-gray-300'}`}>{lang}</span>
                        {language === lang && <Check className="text-blue-400" size={20} />}
                    </button>
                ))}
            </div>
        </div>
    );

    const renderReportView = () => (
        <div className="animate-fade-in h-full flex flex-col">
            <div className="flex items-center mb-6 relative">
                <button onClick={handleBack} className="p-2 -ml-2 hover:bg-gray-900 rounded-full text-blue-400 active:scale-90 transition-transform">
                    <ChevronLeft size={28} />
                </button>
                <h2 className="text-xl font-bold text-white absolute left-1/2 -translate-x-1/2">{t.settings.report_header}</h2>
            </div>

            <div className="flex-1 space-y-6">
                <p className="text-gray-400 text-sm bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                    {t.settings.report_desc}
                </p>

                <textarea
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    placeholder={t.settings.report_placeholder}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-[150px] resize-none"
                />

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                />
                <button
                    onClick={handleFileClick}
                    className={`w-full flex items-center justify-center space-x-2 p-4 border border-dashed ${screenshotName ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-gray-700 text-gray-400 hover:bg-gray-900/50 hover:border-gray-600'} rounded-xl transition-all`}
                >
                    {screenshotName ? <Check size={20} /> : <Upload size={20} />}
                    <span className="truncate max-w-[200px]">{screenshotName || t.settings.upload_screenshot}</span>
                </button>

                <button
                    onClick={handleReportSubmit}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-colors active:scale-[0.98] shadow-lg shadow-blue-900/20"
                >
                    {t.settings.send_report}
                </button>
            </div>
        </div>
    );

    const renderSimpleTextView = (title: string, content: React.ReactNode) => (
        <div className="animate-fade-in h-full flex flex-col">
            <div className="flex items-center mb-6 relative">
                <button onClick={handleSupportBack} className="p-2 -ml-2 hover:bg-gray-900 rounded-full text-blue-400 active:scale-90 transition-transform">
                    <ChevronLeft size={28} />
                </button>
                <h2 className="text-xl font-bold text-white absolute left-1/2 -translate-x-1/2">{title}</h2>
            </div>
            <div className="overflow-y-auto pr-2 menu-scroll flex-1">
                <div className="text-gray-300 space-y-4 leading-relaxed p-1">
                    {content}
                </div>
            </div>
        </div>
    );

    const renderFeedbackView = () => (
        <div className="animate-fade-in h-full flex flex-col">
            <div className="flex items-center mb-6 relative">
                <button onClick={handleSupportBack} className="p-2 -ml-2 hover:bg-gray-900 rounded-full text-blue-400 active:scale-90 transition-transform">
                    <ChevronLeft size={28} />
                </button>
                <h2 className="text-xl font-bold text-white absolute left-1/2 -translate-x-1/2">{t.settings.feedback}</h2>
            </div>

            <div className="flex-1 space-y-6">
                <p className="text-gray-400 text-sm bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                    We value your feedback! Let us know how we can improve GhostByte.
                </p>

                <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Share your thoughts..."
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-[150px] resize-none"
                />

                <button
                    onClick={handleFeedbackSubmit}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-colors active:scale-[0.98] shadow-lg shadow-blue-900/20"
                >
                    Submit Feedback
                </button>
            </div>
        </div>
    );

    const renderSupportView = () => (
        <div className="animate-fade-in h-full">
            <div className="flex items-center mb-6 relative">
                <button onClick={handleBack} className="p-2 -ml-2 hover:bg-gray-900 rounded-full text-blue-400 active:scale-90 transition-transform">
                    <ChevronLeft size={28} />
                </button>
                <h2 className="text-xl font-bold text-white absolute left-1/2 -translate-x-1/2">{t.settings.support_header}</h2>
            </div>

            <div className="space-y-1">
                {[
                    { key: 'terms', label: t.settings.terms, action: () => setActiveView('terms') },
                    { key: 'privacy', label: t.settings.privacy, action: () => setActiveView('privacy') },
                    { key: 'guidelines', label: t.settings.guidelines, action: () => setActiveView('guidelines') },
                    { key: 'blog', label: t.settings.blog, action: () => setActiveView('blog') },
                    { key: 'feedback', label: t.settings.feedback, action: () => setActiveView('feedback') }
                ].map((item) => (
                    <button
                        key={item.key}
                        onClick={() => { item.action(); }}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-900 rounded-xl transition-colors group"
                    >
                        <span className="font-medium text-gray-300 group-hover:text-white">{item.label}</span>
                        <ChevronRight className="text-gray-600 group-hover:text-gray-500" size={18} />
                    </button>
                ))}
            </div>
        </div>
    );

    const renderBlogPostView = () => {
        if (!selectedPost) return null;
        return (
            <div className="animate-fade-in h-full flex flex-col">
                <div className="flex items-center mb-6 relative">
                    <button onClick={handleBlogBack} className="p-2 -ml-2 hover:bg-gray-900 rounded-full text-blue-400 active:scale-90 transition-transform">
                        <ChevronLeft size={28} />
                    </button>
                    <h2 className="text-xl font-bold text-white absolute left-1/2 -translate-x-1/2 max-w-[200px] truncate">Article</h2>
                </div>
                <div className="overflow-y-auto pr-2 menu-scroll flex-1">
                    <div className="space-y-4">
                        <div>
                            <h1 className="text-2xl font-bold text-white leading-tight">{selectedPost.title}</h1>
                            <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                                <span>{selectedPost.date}</span>
                                <span>•</span>
                                <span>{selectedPost.readTime}</span>
                            </div>
                        </div>
                        <div className="h-px bg-gray-800 w-full my-4" />
                        <div className="text-gray-300 leading-relaxed text-sm space-y-4">
                            {selectedPost.content}
                        </div>

                        <div className="pt-8 pb-4">
                            <button
                                onClick={handleBlogBack}
                                className="w-full bg-gray-900 hover:bg-gray-800 text-gray-300 font-medium py-3 rounded-xl transition-colors border border-gray-800"
                            >
                                Back to Blog
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderAboutView = () => {
        const team = [
            { name: 'Tejas J H', id: '314CS23078', role: t.settings.lead, primary: true },
            { name: 'Tharun Shastry', id: '314CS23082', role: t.settings.developer, primary: false },
            { name: 'Uday M', id: '314CS23083', role: t.settings.developer, primary: false },
            { name: 'Sudarshan', id: '314CS23073', role: t.settings.developer, primary: false },
        ];

        return (
            <div className="animate-fade-in h-full">
                <div className="flex items-center mb-6 relative">
                    <button onClick={handleBack} className="p-2 -ml-2 hover:bg-gray-900 rounded-full text-blue-400 active:scale-90 transition-transform">
                        <ChevronLeft size={28} />
                    </button>
                    <h2 className="text-xl font-bold text-white absolute left-1/2 -translate-x-1/2">{t.settings.about_header}</h2>
                </div>

                <div className="space-y-8 overflow-y-auto max-h-[calc(100%-80px)] pr-2 pb-4 menu-scroll">
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-900/40">
                            <span className="text-3xl">🛡️</span>
                        </div>
                        <h3 className="text-2xl font-bold text-white">{t.app.title}</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            {t.app.description}
                        </p>
                    </div>

                    {/* Team */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">{t.settings.team}</h4>

                        {team.filter(t => t.primary).map((member) => (
                            <div key={member.id} className="bg-gradient-to-r from-gray-900 to-gray-800 border border-blue-500/30 rounded-2xl p-4 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-50">
                                    <div className="w-16 h-16 bg-blue-500/10 rounded-full blur-xl" />
                                </div>
                                <div className="flex items-center space-x-4 relative z-10">
                                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-md">
                                        {member.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-white">{member.name}</h5>
                                        <p className="text-blue-400 text-xs font-semibold">{member.role}</p>
                                        <p className="text-[10px] text-gray-500 font-mono mt-1">ID: {member.id}</p>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="grid grid-cols-1 gap-3">
                            {team.filter(t => !t.primary).map((member) => (
                                <div key={member.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-3 flex items-center justify-between hover:bg-gray-900 transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center text-xs font-bold text-gray-400">
                                            {member.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h5 className="font-medium text-gray-200 text-sm">{member.name}</h5>
                                            <p className="text-[10px] text-gray-500 font-mono">{member.id}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center pt-8 border-t border-gray-900">
                        <p className="text-xs text-gray-600 font-medium">GhostByte v1.0.0 • 2026</p>
                    </div>
                </div>
            </div>
        );
    };

    const renderAttachmentModal = () => (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
                <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Upload size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-white">Attach File Manually</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Please attach <span className="text-blue-400 font-mono bg-blue-500/10 px-1 py-0.5 rounded">{screenshotName}</span> manually in your email client.
                    </p>
                    <p className="text-gray-500 text-xs mt-2">
                        Browsers cannot automatically attach files to emails for security reasons.
                    </p>
                </div>
                <button
                    onClick={proceedWithEmail}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-blue-900/20"
                >
                    Open Email App
                </button>
                <button
                    onClick={() => setShowAttachmentModal(false)}
                    className="w-full text-gray-400 font-medium py-2 hover:text-white transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );

    return (
        <div className="max-w-xl mx-auto bg-black min-h-[600px] rounded-3xl border border-gray-800 p-6 shadow-2xl overflow-hidden relative">
            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .menu-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .menu-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .menu-scroll::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 2px;
        }
      `}</style>

            {activeView === 'main' && renderMainView()}
            {activeView === 'language' && renderLanguageView()}
            {activeView === 'report' && renderReportView()}
            {activeView === 'support' && renderSupportView()}
            {activeView === 'about' && renderAboutView()}

            {/* Support Sub-views */}
            {activeView === 'terms' && renderSimpleTextView(t.settings.terms, (
                <>
                    <p>Welcome to GhostByte.</p>
                    <p>By using our app, you agree to secure your data responsibly. Steganography is a powerful tool, and we expect our users to utilize it for ethical privacy protection and legitimate communication purposes.</p>
                    <h3 className="text-white font-bold mt-4 mb-2">1. Usage</h3>
                    <p>You may not use GhostByte for illegal activities, including but not limited to malware distribution or copyright infringement.</p>
                </>
            ))}
            {activeView === 'privacy' && renderSimpleTextView(t.settings.privacy, (
                <>
                    <p>Your privacy is our priority.</p>
                    <p>GhostByte operates entirely on your device for encoding and decoding (client-side processing). We do not store your images or hidden messages on our servers.</p>
                </>
            ))}
            {activeView === 'guidelines' && renderSimpleTextView(t.settings.guidelines, (
                <>
                    <p>Be respectful and responsible.</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Do not use this tool to harass or harm others.</li>
                        <li>Respect intellectual property rights when using images.</li>
                        <li>Report bugs to help us improve the platform for everyone.</li>
                    </ul>
                </>
            ))}

            {activeView === 'blog' && renderSimpleTextView(t.settings.blog, (
                <div className="space-y-4">
                    {blogPosts.map((post) => (
                        <button
                            key={post.id}
                            onClick={() => handleBlogClick(post)}
                            className="w-full text-left bg-gray-900/50 hover:bg-gray-900 p-4 rounded-xl border border-gray-800 transition-all group active:scale-[0.98]"
                        >
                            <h4 className="text-white font-bold group-hover:text-blue-400 transition-colors">{post.title}</h4>
                            <p className="text-xs text-gray-500 mt-1">{post.date} • {post.readTime}</p>
                            <p className="text-sm text-gray-400 mt-2 line-clamp-2">{post.summary}</p>
                        </button>
                    ))}
                </div>
            ))}

            {activeView === 'blog_post' && renderBlogPostView()}
            {activeView === 'feedback' && renderFeedbackView()}

            {/* Modals */}
            {showAttachmentModal && renderAttachmentModal()}
        </div>
    );
};

export default Settings;
