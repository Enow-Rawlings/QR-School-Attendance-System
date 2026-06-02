import { RegisterForm } from '@/components/auth/RegisterForm';
import { redirect } from 'next/navigation';
import { getSessionCookie } from '@/lib/auth';
import { Shield, Lock } from 'lucide-react';

export default async function RegisterPage() {
  // Redirect if already logged in
  const token = await getSessionCookie();
  if (token) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl animate-float" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full filter blur-3xl animate-float" style={{ animationDelay: '-2s' }} />
        <div className="absolute top-1/2 left-1/3 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl animate-float" style={{ animationDelay: '-4s' }} />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Column - Info */}
            <div className="hidden md:block space-y-6 animate-slide-in-left">
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                  Join Today
                </h1>
                <p className="text-xl text-gray-300 leading-relaxed">
                  Create your account and start marking attendance with our secure QR system
                </p>
              </div>

              {/* Benefits */}
              <div className="space-y-4">
                <BenefitCard
                  icon={<Shield className="w-6 h-6" />}
                  title="Secure & Private"
                  description="Your data is encrypted and protected with enterprise-grade security"
                />
                <BenefitCard
                  icon={<Lock className="w-6 h-6" />}
                  title="Verified Identity"
                  description="Photo verification prevents unauthorized attendance marking"
                />
              </div>

              {/* Testimonial */}
              <div className="glass rounded-xl p-4 border border-white/20">
                <p className="text-sm text-gray-300 italic">
                  "This system has revolutionized how we track attendance. It's reliable, secure, and easy to use."
                </p>
                <p className="text-xs text-cyan-400 font-semibold mt-3">— Student, LMU Buea</p>
              </div>
            </div>

            {/* Right Column - Form */}
            <div className="animate-slide-in-right">
              <RegisterForm />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center text-sm text-gray-400">
            <p>
              Questions? Contact{' '}
              <span className="text-cyan-400">support@lmu.edu.cm</span> or visit{' '}
              <a href="/eula" className="text-cyan-400 hover:text-cyan-300 underline">
                our help center
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BenefitCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="glass rounded-xl p-4 border border-white/20">
      <div className="flex gap-4">
        <div className="text-cyan-400 flex-shrink-0">{icon}</div>
        <div>
          <h3 className="font-semibold text-white">{title}</h3>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
      </div>
    </div>
  );
}
