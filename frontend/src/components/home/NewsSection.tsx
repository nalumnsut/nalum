import { useState } from 'react';
import { Check, Clock, Mail, Bell } from 'lucide-react';
import { toast } from 'sonner';

const NewsSection = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setSubscribed(true);
    toast.success('Thank you! We will notify you when the newsletter launches.');
    setEmail('');
  };

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50/80 via-white to-gray-50/50 overflow-hidden">
      {/* Background subtle pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23800000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        {/* Section Header */}
        <div className="mb-10 md:mb-14">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-500 mb-2">
            PULSE OF THE NETWORK
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#b91c1c] mb-3">
            What's Happening
          </h2>
          <p className="text-gray-700 text-sm sm:text-base md:text-lg max-w-xl leading-relaxed">
            Stay tuned to recent gatherings, key milestones, and monthly briefings.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          {/* Card 1: Annual Global Alumni Meetup */}
          <div className="h-full bg-white rounded-2xl border border-gray-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 p-6 md:p-8 flex flex-col justify-between">
            <div>
              {/* Top Row: Badge + Date */}
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Complete
                </span>
                <span className="text-xs sm:text-sm text-gray-500 font-medium">
                  December 27, 2025
                </span>
              </div>

              {/* Title */}
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 tracking-tight">
                Annual Global Alumni Meetup
              </h3>

              {/* Description — short and punchy */}
              <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                Flagship gathering bringing together graduates across batches and industries to reconnect and collaborate.
              </p>

              {/* Divider */}
              <div className="border-t border-gray-100 my-4" />

              {/* Highlights — concise 2 points */}
              <ul className="space-y-2 text-sm text-gray-700 font-medium mb-4">
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>Distinguished alumni keynotes & industry roundtables</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>Cross-domain mentorship & networking sessions</span>
                </li>
              </ul>
            </div>

            {/* Bottom Row */}
            <div>
              <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-xs sm:text-sm">
                <span className="text-gray-500">
                  Dwarka Main Campus
                </span>
                <span className="font-bold text-[#1e3a8a]">
                  500+ Attendees
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Alumni Newsletter */}
          <div className="h-full bg-white rounded-2xl border border-gray-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 p-6 md:p-8 flex flex-col justify-between">
            <div>
              {/* Top Row: Badge + Frequency */}
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  Launching Soon
                </span>
                <span className="text-xs sm:text-sm text-gray-500 font-medium">
                  Monthly Edition
                </span>
              </div>

              {/* Title */}
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 tracking-tight">
                Alumni Newsletter
              </h3>

              {/* Description */}
              <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-6">
                Get monthly alumni stories, campus news, and exclusive invitations straight to your inbox.
              </p>

              {/* Subscription Form */}
              <form onSubmit={handleSubscribe} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50/70 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#b91c1c] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-[#b91c1c] via-[#b41b1b] to-[#991b1b] hover:from-[#a81919] hover:to-[#881313] text-white font-semibold text-sm rounded-xl shadow-md shadow-red-900/10 hover:shadow-lg transition-all"
                >
                  <Bell className="w-4 h-4" />
                  {subscribed ? 'Notification Set!' : 'Notify Me'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsSection;
