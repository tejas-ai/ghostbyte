import React, { useState, useEffect } from 'react';
import {
  Globe,
  LifeBuoy,
  Info,
  ChevronRight,
  ChevronLeft,
  Check,
  Play,
  X,
  Shield,
  Lock,
  Activity,
  FileText,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { useLanguage, LANG_OPTIONS } from '../contexts/LanguageContext';
import { soundFx } from '../services/soundFx';
import {
  getPrivacyContent,
  getTermsContent,
  getGuidelinesContent,
  getVideos,
  getBlogPosts,
  getAboutData,
  LocalizedBlogPost
} from './settingsContent';

type ViewState = 'main' | 'language' | 'support' | 'about' | 'terms' | 'privacy' | 'guidelines' | 'blog' | 'feedback' | 'blog_post' | 'demos';

interface SettingsProps {
  hackerMode?: boolean;
  onToggleHackerMode?: () => void;
  toggleHackerMode?: () => void;
  onToggleHacker?: () => void;
  onOpenKeyring?: () => void;
  onOpenGuide?: () => void;
}

export default function Settings({ onOpenKeyring, onOpenGuide }: SettingsProps) {
  const { language, setLanguage, t } = useLanguage();
  const [activeView, setActiveView] = useState<ViewState>('main');
  const [feedbackText, setFeedbackText] = useState('');

  // Dynamic localized data
  const videos = getVideos(language);
  const blogPosts = getBlogPosts(language);
  const aboutData = getAboutData(language);

  // Blog State
  const [selectedPost, setSelectedPost] = useState<LocalizedBlogPost | null>(null);

  // Theater Mode State
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedVideo(null);
    };
    if (selectedVideo) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedVideo]);

  const handleBack = () => {
    soundFx.playClick();
    setActiveView('main');
  };

  const handleSupportBack = () => {
    soundFx.playClick();
    setActiveView('support');
  };

  const handleLanguageSelect = (lang: string) => {
    soundFx.playClick();
    setLanguage(lang as any);
    setActiveView('main');
  };

  const handleBlogClick = (post: LocalizedBlogPost) => {
    soundFx.playClick();
    setSelectedPost(post);
    setActiveView('blog_post');
  };

  const handleFeedbackSubmit = () => {
    soundFx.playSuccess();
    alert(t.settings.feedback_thanks || "Thank you for your feedback! Your message has been received.");
    setFeedbackText('');
    setActiveView('main');
  };

  // --- SUBVIEWS ---

  const renderMainView = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="pb-4 border-b border-white/[0.1]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md glass-pill-3d text-amber-300 text-[11px] font-mono font-bold mb-2">
          <Shield size={12} className="text-amber-400" />
          <span>Configuration & Cryptographic Whitepaper</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-sans">
          {t.settings.title || 'Settings & Specifications'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">
          {t.settings.subtitle || 'System telemetry, cryptographic specs & zero-server-retention policy'}
        </p>
      </div>

      <div className="space-y-3.5">
        {/* Keyring & Enclave Studio */}
        {onOpenKeyring && (
          <button
            onClick={() => {
              soundFx.playClick();
              onOpenKeyring();
            }}
            className="w-full flex items-center justify-between p-5 rounded-2xl glass-3d-purple hover:scale-[1.008] transition-all cursor-pointer group text-left border-purple-500/30"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_4px_8px_rgba(0,0,0,0.5)]">
                <Lock size={18} />
              </div>
              <div>
                <span className="font-bold text-white text-base block group-hover:text-purple-300 transition-colors">Asymmetric Keyring & Diagnostics</span>
                <span className="text-xs font-mono text-slate-300 font-medium">ECDH P-256 Keypairs, Contact Keys & NIST CAVP Self-Tests</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-lg glass-pill-3d text-xs font-mono font-bold text-purple-300">
                ECDH P-256
              </span>
              <ChevronRight className="text-slate-400 group-hover:text-purple-400 transition-colors" size={18} />
            </div>
          </button>
        )}

        {/* Messenger Stealth Dispatcher Guide */}
        {onOpenGuide && (
          <button
            onClick={() => {
              soundFx.playClick();
              onOpenGuide();
            }}
            className="w-full flex items-center justify-between p-5 rounded-2xl glass-3d-blue hover:scale-[1.008] transition-all cursor-pointer group text-left border-cyan-500/30"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_4px_8px_rgba(0,0,0,0.5)]">
                <Shield size={18} />
              </div>
              <div>
                <span className="font-bold text-white text-base block group-hover:text-cyan-300 transition-colors">Stealth Messenger Dispatch Guide</span>
                <span className="text-xs text-slate-300 font-medium">WhatsApp, Telegram, Signal & Discord Zero-Loss Compression Bypass</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-lg glass-pill-3d text-xs font-mono font-bold text-cyan-300">
                1-Click ZIP
              </span>
              <ChevronRight className="text-slate-400 group-hover:text-cyan-400 transition-colors" size={18} />
            </div>
          </button>
        )}

        {/* Language Selection */}
        <button
          onClick={() => {
            soundFx.playClick();
            setActiveView('language');
          }}
          className="w-full flex items-center justify-between p-5 rounded-2xl glass-3d-blue hover:scale-[1.008] transition-all cursor-pointer group text-left"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_4px_8px_rgba(0,0,0,0.5)]">
              <Globe size={18} />
            </div>
            <div>
              <span className="font-bold text-white text-base block group-hover:text-cyan-300 transition-colors">{t.settings.language || 'Language & Localization'}</span>
              <span className="text-xs font-mono text-slate-300 font-medium">Current: {language}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-lg glass-pill-3d text-xs font-mono font-bold text-cyan-300">
              {language}
            </span>
            <ChevronRight className="text-slate-400 group-hover:text-cyan-400 transition-colors" size={18} />
          </div>
        </button>

        {/* Video Guided Walkthroughs */}
        <button
          onClick={() => {
            soundFx.playClick();
            setActiveView('demos');
          }}
          className="w-full flex items-center justify-between p-5 rounded-2xl glass-3d-purple hover:scale-[1.008] transition-all cursor-pointer group text-left"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 text-white flex items-center justify-center shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_4px_8px_rgba(0,0,0,0.5)]">
              <Play size={18} />
            </div>
            <div>
              <span className="font-bold text-white text-base block group-hover:text-pink-300 transition-colors">{t.settings.demos || 'Video Guided Walkthroughs'}</span>
              <span className="text-xs text-slate-300 font-medium">{t.settings.demos_desc || 'Step-by-step masterclasses on steganographic workflows'}</span>
            </div>
          </div>
          <ChevronRight className="text-slate-400 group-hover:text-pink-400 transition-colors" size={18} />
        </button>

        {/* Support & Documentation */}
        <button
          onClick={() => {
            soundFx.playClick();
            setActiveView('support');
          }}
          className="w-full flex items-center justify-between p-5 rounded-2xl glass-3d-emerald hover:scale-[1.008] transition-all cursor-pointer group text-left"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-400 text-white flex items-center justify-center shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_4px_8px_rgba(0,0,0,0.5)]">
              <LifeBuoy size={18} />
            </div>
            <div>
              <span className="font-bold text-white text-base block group-hover:text-teal-300 transition-colors">{t.settings.support || 'Support & Security Protocols'}</span>
              <span className="text-xs text-slate-300 font-medium">{t.settings.terms_desc || 'Zero-Server guarantee, Privacy & Legal documentation'}</span>
            </div>
          </div>
          <ChevronRight className="text-slate-400 group-hover:text-teal-400 transition-colors" size={18} />
        </button>

        {/* About & Technical Specifications */}
        <button
          onClick={() => {
            soundFx.playClick();
            setActiveView('about');
          }}
          className="w-full flex items-center justify-between p-5 rounded-2xl glass-3d hover:scale-[1.008] transition-all cursor-pointer group text-left border-amber-500/30"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_4px_8px_rgba(0,0,0,0.5)]">
              <Info size={18} />
            </div>
            <div>
              <span className="font-bold text-white text-base block group-hover:text-amber-300 transition-colors">{t.settings.about || 'Cryptographic Whitepaper & Specs'}</span>
              <span className="text-xs text-slate-300 font-medium">{t.settings.whitepaper_desc || 'Detailed cryptographic parameters & system architecture'}</span>
            </div>
          </div>
          <ChevronRight className="text-slate-400 group-hover:text-amber-400 transition-colors" size={18} />
        </button>
      </div>

      {/* Security Architecture Guarantee Note with 3D Beveled Pill */}
      <div className="p-5 rounded-2xl glass-3d flex items-center gap-3.5 border-cyan-400/30">
        <Shield size={22} className="text-cyan-400 shrink-0" />
        <p className="text-xs text-slate-300 leading-relaxed font-mono font-medium">
          QuietSend strictly operates as a self-contained client-side web application. All cryptographic transforms execute inside isolated local memory frames.
        </p>
      </div>
    </div>
  );

  const renderLanguageView = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 border-b border-white/[0.1] pb-4">
        <button
          onClick={handleBack}
          className="p-2 rounded-xl glass-pill-3d text-cyan-300 hover:text-white transition-colors cursor-pointer"
        >
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-xl font-bold text-white tracking-tight">{t.settings.choose_language || 'Choose Language'}</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {LANG_OPTIONS.map((l) => (
          <button
            key={l.code}
            onClick={() => handleLanguageSelect(l.code)}
            className={`flex items-center justify-between p-4 rounded-2xl transition-all text-left cursor-pointer ${
              language === l.code
                ? 'glass-3d-blue border-cyan-400 text-white scale-[1.015]'
                : 'glass-3d hover:border-white/25 text-slate-300'
            }`}
          >
            <div>
              <span className="text-base font-black block text-white">
                {l.native}
              </span>
              <span className="text-xs font-mono text-cyan-300 font-bold">{l.label}</span>
            </div>
            {language === l.code && <Check className="text-cyan-400" size={20} />}
          </button>
        ))}
      </div>
    </div>
  );

  const renderAboutView = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 border-b border-white/[0.1] pb-4">
        <button
          onClick={handleBack}
          className="p-2 rounded-xl glass-pill-3d text-cyan-300 hover:text-white transition-colors cursor-pointer"
        >
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-xl font-bold text-white tracking-tight">{t.settings.about || 'Cryptographic Architecture'}</h2>
      </div>

      <div className="space-y-6">
        {/* Core Specs with 3D Glass Surfaces */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {aboutData.cards.map((c, i) => {
            const cardGlass = ['glass-3d-blue', 'glass-3d-purple', 'glass-3d-emerald'][i] || 'glass-3d-blue';
            return (
              <div key={i} className={`${cardGlass} p-5 space-y-1.5`}>
                <p className="text-[10px] font-mono text-cyan-300 uppercase tracking-wider font-bold">{c.label}</p>
                <p className="text-xl font-black text-white font-mono">{c.val}</p>
                <p className="text-xs text-slate-300 leading-normal font-medium">{c.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Architecture Specs Table */}
        <div className="p-6 rounded-2xl glass-3d space-y-4">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">{aboutData.tableTitle}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs font-mono">
            {aboutData.table.map(([k, v]) => (
              <div key={k} className="p-3.5 rounded-xl bg-black/60 border border-white/15 shadow-inner">
                <span className="text-[10px] text-slate-400 block font-bold">{k}</span>
                <span className="text-slate-100 truncate block mt-0.5 font-black">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSupportView = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 border-b border-white/[0.1] pb-4">
        <button
          onClick={handleBack}
          className="p-2 rounded-xl glass-pill-3d text-cyan-300 hover:text-white transition-colors cursor-pointer"
        >
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-xl font-bold text-white tracking-tight">{t.settings.support || 'Support & Security Documentation'}</h2>
      </div>

      <div className="space-y-3">
        {[
          { key: 'privacy', label: t.settings.privacy || 'Privacy & Zero-Retention Architecture', icon: Shield, color: 'text-cyan-400' },
          { key: 'terms', label: t.settings.terms || 'Terms of Service & Usage Protocols', icon: Lock, color: 'text-purple-400' },
          { key: 'guidelines', label: t.settings.guidelines || 'Operational Security Guidelines', icon: Info, color: 'text-amber-400' },
          { key: 'blog', label: t.settings.blog || 'Forensic Research & Intel', icon: Activity, color: 'text-emerald-400' },
          { key: 'feedback', label: t.settings.feedback || 'Send Feedback & Technical Inquiries', icon: MessageSquare, color: 'text-pink-400' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => {
                soundFx.playClick();
                setActiveView(item.key as ViewState);
              }}
              className="w-full flex items-center justify-between p-4.5 rounded-2xl glass-3d hover:scale-[1.008] transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <Icon size={18} className={item.color} />
                <span className="text-sm font-bold text-slate-200 group-hover:text-white">{item.label}</span>
              </div>
              <ChevronRight className="text-slate-400 group-hover:text-cyan-400" size={16} />
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderSimpleTextView = (title: string, content: React.ReactNode) => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 border-b border-white/[0.1] pb-4">
        <button
          onClick={handleSupportBack}
          className="p-2 rounded-xl glass-pill-3d text-cyan-300 hover:text-white transition-colors cursor-pointer"
        >
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
      </div>
      <div className="p-6 sm:p-8 rounded-2xl glass-3d text-xs sm:text-sm text-slate-300 space-y-4 leading-relaxed font-sans font-medium">
        {content}
      </div>
    </div>
  );

  const renderDemosView = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 border-b border-white/[0.1] pb-4">
        <button
          onClick={handleBack}
          className="p-2 rounded-xl glass-pill-3d text-cyan-300 hover:text-white transition-colors cursor-pointer"
        >
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-xl font-bold text-white tracking-tight">{t.settings.demos || 'Video Guided Walkthroughs'}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {videos.map((v, i) => (
          <div
            key={i}
            onClick={() => {
              soundFx.playClick();
              setSelectedVideo(v.src);
            }}
            className="p-5 rounded-2xl glass-3d-purple hover:scale-[1.015] transition-all cursor-pointer group space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-md glass-pill-3d text-[10px] font-mono font-bold text-pink-300">
                {v.difficulty}
              </span>
              <Play size={16} className="text-pink-400 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base group-hover:text-pink-300 transition-colors">{v.title}</h4>
              <p className="text-xs text-slate-300 mt-1">{v.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Video Theater Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="relative max-w-4xl w-full rounded-2xl overflow-hidden glass-3d p-2 shadow-2xl border-cyan-400/40"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/80 text-white flex items-center justify-center hover:bg-white/20 transition-all border border-white/20"
            >
              <X size={18} />
            </button>
            <video src={selectedVideo} controls autoPlay className="w-full rounded-xl aspect-video bg-black" />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      {activeView === 'main' && renderMainView()}
      {activeView === 'language' && renderLanguageView()}
      {activeView === 'support' && renderSupportView()}
      {activeView === 'about' && renderAboutView()}
      {activeView === 'demos' && renderDemosView()}
      {activeView === 'privacy' && renderSimpleTextView(
        t.settings.privacy || 'Zero-Server-Retention Privacy Policy',
        getPrivacyContent(language)
      )}
      {activeView === 'terms' && renderSimpleTextView(
        t.settings.terms || 'Terms of Service',
        getTermsContent(language)
      )}
      {activeView === 'guidelines' && renderSimpleTextView(
        t.settings.guidelines || 'Security Guidelines',
        getGuidelinesContent(language)
      )}
      {activeView === 'blog' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-3 border-b border-white/[0.1] pb-4">
            <button
              onClick={handleSupportBack}
              className="p-2 rounded-xl glass-pill-3d text-cyan-300 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-xl font-bold text-white tracking-tight">{t.settings.blog || 'Forensic Research Articles'}</h2>
          </div>
          <div className="space-y-3.5">
            {blogPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => handleBlogClick(post)}
                className="p-5 rounded-2xl glass-3d-blue hover:scale-[1.01] transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-cyan-400 font-bold">{post.date} · {post.readTime}</span>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-cyan-400" />
                </div>
                <h4 className="font-bold text-white text-base group-hover:text-cyan-300 transition-colors">{post.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">{post.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {activeView === 'blog_post' && selectedPost && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-3 border-b border-white/[0.1] pb-4">
            <button
              onClick={() => setActiveView('blog')}
              className="p-2 rounded-xl glass-pill-3d text-cyan-300 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-xl font-bold text-white tracking-tight">{selectedPost.title}</h2>
          </div>
          <div className="p-6 sm:p-8 rounded-2xl glass-3d text-xs sm:text-sm text-slate-300 space-y-4 leading-relaxed font-sans font-medium">
            {selectedPost.content}
          </div>
        </div>
      )}
      {activeView === 'feedback' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-3 border-b border-white/[0.1] pb-4">
            <button
              onClick={handleSupportBack}
              className="p-2 rounded-xl glass-pill-3d text-cyan-300 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-xl font-bold text-white tracking-tight">{t.settings.feedback || 'Send Feedback'}</h2>
          </div>
          <div className="p-6 rounded-2xl glass-3d space-y-4">
            <p className="text-xs text-slate-300 font-medium">{t.settings.feedback_desc || 'Share suggestions, bug reports, or security findings directly with the maintainers.'}</p>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder={t.settings.feedback_placeholder || 'Type your technical feedback, security findings or feature requests...'}
              rows={5}
              className="w-full app-input p-4 text-sm text-slate-100 placeholder-slate-500 resize-none font-mono"
            />
            <button
              onClick={handleFeedbackSubmit}
              className="w-full py-3.5 rounded-xl font-mono font-bold text-xs uppercase tracking-wider btn-3d-blue text-white cursor-pointer"
            >
              {t.settings.feedback_submit || 'Submit Feedback'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
