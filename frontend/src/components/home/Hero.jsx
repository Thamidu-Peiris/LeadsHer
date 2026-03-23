import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const MARQUEE_WORDS = ['Leadership','Mentorship','Innovation','Community','Empowerment','Resilience'];
const ALL = [...MARQUEE_WORDS, ...MARQUEE_WORDS];

const PORTRAITS = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCv-6RcCoemdiPRB8OfHqffNv52CRxOhDk3m68gHT4UeAmHzbOqw0RAQtE3kD4du5S6xY4MSDpfnLrRUUeQrFjDT2P0I6t0EPACEl47-P3ivf5AFrBUSkd8TXxl3FK8P0N0oBB-zSkPhzyMP-tVQirinfRvwZWcXlnvSUUqIepsNjnTxbmxVyvjDAKdzm_rPFyXXtCJqGC5ej4bn1FbYeQL9XYFHlxs2JsOouG7SNgxFVBl9MFTKDjGHHBoYKBRxqHQGnXYAJYzWA',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDM2q67jwYbUdsBDst2MOfF5MYPENZPWx7oPP4rm9LHgxXvomiMOZWvngCfSvgtj3_M2mKKHHy7UgyxfaoUfX6wAICbRNm1g95uVFM0URl1I5Ai3NsUiOejRtNPali0GREY8Gsu6_6YfW-2EbBvOqrULbEsNL9Bu0ghDf0-BQYuf7GkaAz4HC_fv_CNjOhgO7ybjaai0Ncy3cFvIvN6XSjEEvtW6s6o3IaXx__QzMA3aLk6mCakcx5x-lAh795l4S82YiNyZ2C70A',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCNsUOmQ0oNeEPzl7QT6-R-Aq2UgDC-A4F5sBAuOzlvM0KWfEa0zo-eloPpJ4_k8vMoxmGh0SNmGm7Q4cOPuoFju6VucAUPXJZmklWiRjjVECE3_77g92hCiTnvw_JKM6-gDwMEFMixeFOyuhanK-UCNbdJtqmUWWY6v_4TNsLZ_dNg_5WPqzj_P1MbvSaYe7N1mmbhYDgPbx3miueUynNXXjirk9F3r34hVQoTmEl0KKH39Q2IOvrH6MnyOHToYH6GMqdxS2h6eA',
];

export default function Hero() {
  const { isAuthenticated } = useAuth();
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden border-b border-gold/10">
      {/* Geometric overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none geometric-bg" />

      <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 items-center gap-12 relative z-10 py-20">
        {/* Left */}
        <div>
          <h1 className="font-cormorant text-7xl md:text-8xl lg:text-[96px] leading-[1.1] mb-8">
            Where Women Lead. <br />
            <span className="italic text-dusty-rose">Where Stories Ignite.</span>
          </h1>
          <p className="font-dm-sans text-gray-400 text-xl max-w-lg mb-10 leading-relaxed">
            Amplifying voices, fostering connections, and redefining leadership for the next generation of visionaries.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to={isAuthenticated ? '/dashboard' : '/register'} className="btn-gold">
              Join the Community
            </Link>
            <Link to="/stories" className="btn-gold-outline">
              Explore Stories
            </Link>
          </div>
        </div>

        {/* Right – editorial collage */}
        <div className="relative h-[500px] hidden lg:block">
          <div className="absolute top-0 right-0 w-64 h-80 border border-gold/40 rounded-eight overflow-hidden transform translate-x-4 -translate-y-4">
            <img src={PORTRAITS[0]} alt="Leader" className="w-full h-full object-cover" />
          </div>
          <div className="absolute top-1/2 left-1/2 w-64 h-80 border border-gold/60 rounded-eight overflow-hidden transform -translate-x-1/2 -translate-y-1/2 z-10 shadow-2xl">
            <img src={PORTRAITS[1]} alt="Leader" className="w-full h-full object-cover" />
          </div>
          <div className="absolute bottom-0 left-0 w-64 h-80 border border-gold/40 rounded-eight overflow-hidden transform -translate-x-4 translate-y-4">
            <img src={PORTRAITS[2]} alt="Leader" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Scrolling marquee */}
      <div className="absolute bottom-0 left-0 w-full py-6 border-t border-gold/20 bg-dark-bg/80 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap">
          {ALL.map((word, i) => (
            <span key={i} className="text-gold uppercase tracking-[0.3em] font-montserrat text-sm mx-12">
              {word}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
