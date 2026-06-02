import { LoginForm } from '@/components/auth/LoginForm';
import { redirect } from 'next/navigation';
import { getSessionCookie } from '@/lib/auth';
import { BookOpen, Users, Zap } from 'lucide-react';

export default async function LoginPage() {
  // Redirect if already logged in
  const token = await getSessionCookie();
  if (token) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full filter blur-3xl animate-float" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl animate-float" style={{ animationDelay: '-2s' }} />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl animate-float" style={{ animationDelay: '-4s' }} />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Column - Info */}
            <div className="hidden md:block space-y-8 animate-slide-in-left">
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-4">
                  QR Attendance System
                </h1>
                <p className="text-xl text-gray-300 leading-relaxed">
                  Smart, secure, and professional attendance tracking for Landmark Metropolitan University of Buea
                </p>
              </div>

              {/* Features */}
              <div className="space-y-4">
                <FeatureCard
                  icon={<Zap className="w-6 h-6" />}
                  title="Real-Time Tracking"
                  description="Instant QR code generation and attendance marking"
                />
                <FeatureCard
                  icon={<Users className="w-6 h-6" />}
                  title="Role-Based Access"
                  description="Separate dashboards for students, lecturers, and administrators"
                />
                <FeatureCard
                  icon={<BookOpen className="w-6 h-6" />}
                  title="Academic Integrity"
                  description="Prevent proxy attendance with photo verification and token validation"
                />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/10">
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-400">100%</div>
                  <p className="text-sm text-gray-400">Secure</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-400">24/7</div>
                  <p className="text-sm text-gray-400">Available</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-400">GDPR</div>
                  <p className="text-sm text-gray-400">Compliant</p>
                </div>
              </div>
            </div>

            {/* Right Column - Form */}
            <div className="animate-slide-in-right">
              <LoginForm />
            </div>
          </div>

          {/* Bottom Info - Mobile Friendly */}
          <div className="mt-12 pt-8 border-t border-white/10 text-center">
            <p className="text-gray-400 text-sm">
              <span className="font-semibold text-cyan-400">Privacy First:</span> Your data is encrypted, secure, and only used for attendance tracking.
              <br />
              Read our <a href="/eula" className="text-cyan-400 hover:text-cyan-300 underline">End User License Agreement</a> to learn more.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="glass rounded-xl p-4 border border-white/20 hover:border-cyan-400/50 transition-smooth group cursor-pointer">
      <div className="flex gap-4">
        <div className="text-cyan-400 group-hover:text-cyan-300 transition-smooth flex-shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-white group-hover:text-cyan-300 transition-smooth">
            {title}
          </h3>
          <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-smooth">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
