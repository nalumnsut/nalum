import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface GivingCardProps {
  title: string;
  description: string;
  image: string;
  index: number;
}

const GivingCard = ({ title, description, image, index }: GivingCardProps) => (
  <div className="group rounded-xl overflow-hidden border border-gray-200 hover:border-nsut-maroon transition-colors duration-300 flex flex-col bg-white h-full">
    <div className="h-56 overflow-hidden relative">
      <div className="absolute inset-0 bg-nsut-maroon/10 group-hover:bg-nsut-maroon/0 transition-colors duration-300 z-10" />
      <img
        src={image}
        alt={title}
        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
      />
    </div>
    <div className="p-8 flex-1 flex flex-col bg-gray-50">
      <h3 className="text-xl font-serif font-bold text-gray-900 mb-3 group-hover:text-nsut-maroon transition-colors">
        {title}
      </h3>
      <p className="text-gray-600 text-sm leading-relaxed flex-1">
        {description}
      </p>
    </div>
  </div>
);

const GivingSection = () => {
  const givingCategories = [
    {
      title: "NSUT Annual Fund",
      description: "Support the university's most pressing needs and emerging opportunities through flexible funding that impacts every student.",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAeOxmDQpmqo0g9mdNkIKKgRO7CmUQbplVgSjEzlpwHrXhvqYuf1BESuF2kvom3J4DmyMBQLEfPv539Kwf3J3c7mUnMtG5BqUMDBlsYu7nkCc9SThjWy_8iKEdvvBqitArNbRompifEpdcgGvFAbr9DO3mVx31g8jZEc6RuuhVxA_szvoa7KmStSixLR9VrfIaQ51QCiekfrJLCaTLb4k0JnSX7_2ihaGxHagRC81OItcfo6N0S435q-zkfjbas9ecWq7wkR3A_lzAb"
    },
    {
      title: "Scholarships & Aid",
      description: "Help deserving students access quality education regardless of financial constraints through merit and need-based aid.",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCkmHg1-cSY2fh0kWDWypMJLC3az5EmOq09ude6OsfEAzdJcVnHd4KbjPgKaq9jkJadPgquIriPDEJaClFsWEe2ibHfKdT8GiuJ1euv2GuD05oTXVODS0PU4BQicjhnoDmSAvl29VZ9PZpqAmebwU_KTSdXKj6jlDXpV1oyNEcdpufxubSEd_X9oP54-T3d9tPc1RaulXHhnfVhjPKeKfAf4TUZqh998_q6sjOVhGXVTY4CB1_FvQaSQXzXwLuWIyycwhuNRSkYqjdd"
    },
    {
      title: "Research & Innovation",
      description: "Fund groundbreaking research and technological advancements that solve real-world problems and drive progress.",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBVPb0lGBQTzpQSG5nRJxRM9kX0Y3rgdJqnrMjZQHDso1GYddMA4VSgB47fQ25Y65UYHBnQeElWVQNm2-4CmzytQzn0vOq3CK6zPFIud3XDFdTxsx1ehWZAgMf-cRBz0YisYrHC3pmlaZ9IWAZ1GRi28Pk7bloXd3E7mdnVWVzjxy7WYqIfrYtDwy17x-S_3I4R3iVhmnHD8cGMtstOmahEWHuzUj76auD4mduiyY0Elr0BwE-12HXAyR-VEhnbsU1-eRG7-KfMJ8hB"
    },
    {
      title: "Infrastructure",
      description: "Contribute to building world-class facilities and campus development that inspire learning and collaboration.",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDmj1sv-oCLJjBSV_6BV9Brz-YF7qXF_KEHSv3RQlmqDOjDUIzAHFfGCQlI_XguqkWBck53vgkEUe0wbaqXX6bxSkNHTpbkQkGwjEn8weDR0RrFroEWeYnoIG_oKsbTqq3sw83JQf1IkjB7QYC5Cp1qefIQTtlpyihMq1afYFSGYJVvZGyjX91tIQUM46vkpSaHMGPys1AOQYd3QoWotvXVKQo8kxsFtvADdmJsJ0iRZ9GglJ0AlIPNt-JHGGClMAR77aHOXOC8hybS"
    },
    {
      title: "Academic Programs",
      description: "Enhance curriculum, faculty development, and learning resources to maintain academic excellence.",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDhRRtuxK1FsDbzIYqzj9_CcpR7kij66wUqx1-IyO3tt8LjudEV-yHNLATPbxsrpjGP4-FnftvID1ucaHSpJx7sOuP_gBqoueQqEN49Ilm3xs36QapLNJJgEkRdFTl8qcrCtrs9hoyy0K4v-mvp_QrM-6RSWXsoLaHLMx0P56s1RCmuaU31795rJeDc6MempeXLMjvf2-U39GUOwNBse7h1Oca_uLceyaRLd0yGtfUMB3mzONqecXPLZJ1Vz_rHY-zPKbD9NTDyi9bN"
    },
  ];

  return (
    <div className="relative py-12 md:py-20 bg-gradient-to-b from-gray-50 to-white">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23800000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-nsut-maroon to-transparent opacity-20" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <div className="inline-block mb-3">
            <span className="text-nsut-maroon text-xs md:text-sm font-semibold tracking-wider uppercase">
              Give Back
            </span>
          </div>
          <h2 className="text-2xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
            Make a Difference
          </h2>
          <p className="text-base md:text-lg text-gray-600 leading-relaxed">
            Support NSUT students and faculty in various ways, from funding scholarships to advancing critical research and infrastructure development.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {givingCategories.map((category, index) => (
            <GivingCard
              key={index}
              title={category.title}
              description={category.description}
              image={category.image}
              index={index}
            />
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="inline-flex flex-col sm:flex-row gap-4 items-center">
            <Button
              asChild
              size="lg"
              className="bg-nsut-maroon hover:bg-nsut-maroon/90 text-white font-semibold px-8 h-14"
            >
              <Link to="/login">
                Start Giving Today
              </Link>
            </Button>
          </div>

          {/* Trust indicator */}
          <p className="mt-6 text-sm text-gray-500">
            Your contribution is tax-deductible and goes directly to supporting NSUT's mission
          </p>
        </div>
      </div>
    </div>
  );
};

export default GivingSection;
