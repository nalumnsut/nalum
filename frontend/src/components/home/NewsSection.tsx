import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, LucideIcon } from 'lucide-react';

interface NewsArticle {
  badge?: string;
  headline: string;
  date?: string;
  description: string;
  details?: string[];
  link?: string;
  cta?: string;
}

const NewsCard = ({ article }: { article: NewsArticle }) => {
  let badgeText = article.badge;
  let isCompleted = false;

  if (article.date) {
    const eventDate = new Date(article.date);
    const today = new Date();
    // Reset time components for accurate date-only comparison
    today.setHours(0, 0, 0, 0);

    if (eventDate < today) {
      badgeText = 'COMPLETED';
      isCompleted = true;
    }
  }

  return (
    <div className="group h-full">
      <div className="relative bg-white rounded-xl border-2 border-gray-100 hover:border-nsut-maroon/30 transition-all duration-300 overflow-hidden h-full flex flex-col">
        {/* Accent line - change color if completed */}
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${isCompleted ? 'from-gray-400 to-gray-200' : 'from-nsut-maroon to-nsut-yellow'} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />

        <div className="p-5 md:p-8 flex-grow flex flex-col">

          {/* Content */}
          <h3 className={`font-serif text-2xl font-bold ${isCompleted ? 'text-gray-600' : 'text-gray-900'} mb-3 group-hover:text-nsut-maroon transition-colors duration-300`}>
            {article.headline}
          </h3>

          {/* Date/Badge */}
          {badgeText && (
            <span className={`inline-block text-xs font-semibold ${isCompleted ? 'text-gray-600 bg-gray-100' : 'text-nsut-maroon bg-nsut-yellow/20'} px-3 py-1 rounded-full mb-3 w-fit`}>
              {badgeText}
            </span>
          )}

          {article.date && (
            <div className="flex items-center text-sm text-gray-500 mb-3">
              <Calendar className="h-4 w-4 mr-2" />
              {article.date}
            </div>
          )}

          <p className="text-gray-600 leading-relaxed mb-4 flex-grow">
            {article.description}
          </p>

          {/* Additional info for newsletter */}
          {article.details && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-100">
              <ul className="space-y-2 text-sm text-gray-700">
                {article.details.map((detail: string, idx: number) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-nsut-maroon mr-2">•</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA */}
          {article.link && (
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-nsut-maroon font-semibold text-sm group-hover:gap-2 transition-all duration-300 mt-auto"
            >
              <span>{article.cta || 'Learn more'}</span>
              <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-300" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

const NewsSection = () => {
  const articles = [
    {
      badge: 'UPCOMING EVENT',
      headline: 'Alumni Meetup',
      date: 'December 27, 2025',
      description: 'Join us in celebrating the achievements of our alumni at the annual Alumni Meetup. Reconnect with old friends, network with fellow graduates, and hear inspiring stories from distinguished speakers.',
      link: null,
      details: [
        'Networking sessions with alumni from various industries',
        'Keynote speeches from notable alumni',
        'Workshops on career development and personal growth'
      ],
    },
    {
      badge: 'COMING SOON',
      headline: 'Alumni Newsletter Launch',
      description: 'We are excited to announce the upcoming launch of the official NSUT Alumni Newsletter! Stay informed about campus updates, alumni achievements, networking opportunities, and exclusive events.',
      details: [
        'Monthly digital newsletter featuring alumni stories and campus news',
        'Exclusive invitations to reunions, webinars, and networking events',
        'Career opportunities and mentorship programs',
        'Updates on university developments and research breakthroughs'
      ],
      cta: 'Coming January 2025'
    },
  ];

  return (
    <div className="relative py-12 md:py-20 bg-white">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23800000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <div className="inline-block mb-3">
            <span className="text-nsut-maroon text-xs md:text-sm font-semibold tracking-wider uppercase">
              News & Updates
            </span>
          </div>
          <h2 className="text-2xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
            Stay Informed
          </h2>
          <p className="text-base md:text-lg text-gray-600 leading-relaxed">
            Latest announcements and upcoming events from the NSUT alumni community
          </p>
        </div>

        {/* News Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-10">
          {articles.map((article, index) => (
            <NewsCard key={index} article={article} />
          ))}
        </div>

        {/* Bottom note */}
        <div className="text-center">
          <p className="text-gray-500 text-sm">
            More stories and updates coming soon as we expand our alumni network
          </p>
        </div>
      </div>
    </div>
  );
};

export default NewsSection;
