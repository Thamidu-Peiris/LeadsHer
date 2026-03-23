import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { storyApi } from '../../api/storyApi';

const PLACEHOLDER_STORIES = [
  {
    _id: 'p1',
    title: 'The Architecture of Resilient Teams',
    category: 'Strategy',
    author: { name: 'Elena Vance' },
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCox0FpDDR-hW5K_OrUgXX6HrFL3BO6FFD2XexVUey6Mapagzt3r4aB31YwRrFaYxMuHkoDzdCSqOAPVZpbxGKLHl76BTmLV1YY_SzDPvcz7r_6k3-sYuAQkpFN2ixr2vlkm8esFC0gWNl-HEcyy8zh5i-uqqlkz7hUpa63kKFlwTarcHXkRM91srGxg-pq-0YMWI24bam68kWGuCoZxMmGmsknynFuxKssneq9C026VunCE3AmFNNokQkKCwfpp4ehOBT1VJn5Vg',
    authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDGHN33qT2lo8DCwGEMqfALfKSvHVyJvJr3HQVHNwpyOLiTG0VywIvGVO2PP7QJCRaMIUDlkAWE5QqfVqftZnsqfc6MFC58MCVHjZBE0UfvUnPuwyqMKgXSuXjJuSChnGxYjH89qPXDIe-Lf0ni6q6N-kW4e_yOrWpN9sVhVT1KvnPYomZ32Mn-SynqdTw58Yrt6EHf2Ng55DfnC0yrvaMUaFFGGzML4mQH8c9m4NN1ffRGgdNZolDnIvXEcuyLDzmKfp4AKCa4ng',
  },
  {
    _id: 'p2',
    title: 'Breaking the Glass Ceiling in FinTech',
    category: 'Innovation',
    author: { name: 'Sarah Chen' },
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA0W0jEOV8JatWNRfLhTj9mo-IfLD52C5puticBq3ZLoZEEv3k57Mw7Ck5wcFFjQ9BTVNL2zRxrDukGwaPvbtbqXWhWTJbT2IKB9bYnN7c_Jg5GaG3lB3ZzFk0QalmKNlLklxpRJA_9hdKFmOn7Im1Z4y13w2Sv6X0e3A7zRMWxjEqwPy96O1OUvon2Kw1NBFyQ2lZGCZho8u5ck21eyUBQ9A0PbVz8wcK0n5RdjKTIxTuO2zgRwox9zDRhtm-PKyUOlHl3okmyig',
    authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCsrCWDbTUd-kaxzYWrqFhUoU7Iqdbw1TOuTe4VDcDshIejgEA_bHnKeRpGtUfK7eys14MeqLGeWeK0HoswrUPXKsQJFKJGHFm-QKSbuPEZaxhRY0YZicx811M95x-a1juWs0aJsRIqbXvnjGJRCydoJt2MUqUyK0eyMfddbh9DDdISt7ffQaSoIgpPHdf12Nr4qDfQOuzVA8BIRZaKMhLDJbf3KmrTwt8CvWyUl4Tlp8CtnmLUoxCJ0BzzcG35n5KaeDDYtAZilA',
  },
  {
    _id: 'p3',
    title: 'Navigating Cultural Nuance in Global Markets',
    category: 'Growth',
    author: { name: 'Amara Okafor' },
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuArt2h1K9T9W6clqkHFJL-cdu0TIKAK5KNooJioR0insYiz3REcQYGDRmIhOX89Q9pGSZ6F83TUPHz39tc0KG1xD1ekrmI8aUBM9yF6e8DeiWlVQTXKJFN2NY4zsxuePoNnMWmLxeLnu-UdTqjLRp-tBlLCylcWRbHpWAyqUzkdBMByoGX8Kdfs_3NMrpnmojOKlmdgQ6eLwmJG3wRzfe6QHiMMv_1tyXW5OIBPd8Z_AW1wQt1UuQGA4XDMB1Yf4kKrSEUhO4OuUA',
    authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD5kVoaucnaMq1ZFDXX4sVPj6SKeznEnOFzPsmaAOapokxoR4rhNcqJD85ibAAW3CwcfKgVCfPmxhqxQG4R9O_gaNGdaFmxxA3eSSXveHUWDuuvmtuUDPWZ-sJTFs8XaXVdOtsv8muD5ukKIW7dwI-WKKlOFyUQQehEvwcoQ3QoyDzsCCa3GwbtzCewCGmQjjZnjLRwd0w2xFyez04aoWKY3XWhltc-WYJyGZhd9J_vcPzdKTtJemU-DtMn_MJ4TxqtKyE4rrs__A',
  },
];

function mapStory(s) {
  return {
    _id: s._id,
    title: s.title,
    category: s.category || 'Leadership',
    author: s.author,
    coverImage: s.coverImage || null,
    authorAvatar: s.author?.profilePicture || null,
  };
}

export default function FeaturedStories() {
  const [stories, setStories] = useState(PLACEHOLDER_STORIES);

  useEffect(() => {
    storyApi.getFeatured()
      .then((res) => {
        const data = res.data?.stories || res.data || [];
        if (data.length >= 3) setStories(data.slice(0, 3).map(mapStory));
      })
      .catch(() => {});
  }, []);

  return (
    <section className="py-24 bg-dark-bg">
      <div className="container mx-auto px-6">
        <h2 className="font-cormorant italic text-4xl md:text-5xl mb-16 text-center">
          Their Words, Your Inspiration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {stories.map((s) => (
            <Link to={`/stories/${s._id}`} key={s._id}>
              <article className="group cursor-pointer">
                {/* Cover */}
                <div className="relative aspect-[4/5] mb-6 overflow-hidden rounded-eight">
                  {s.coverImage ? (
                    <img
                      src={s.coverImage} alt={s.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-dark-card to-dark-section flex items-center justify-center transition-transform duration-700 group-hover:scale-105">
                      <svg className="w-16 h-16 text-gold/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  )}
                  <span className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1 text-[10px] uppercase tracking-widest text-gold border border-gold/30">
                    {s.category}
                  </span>
                </div>

                {/* Text */}
                <h3 className="font-playfair text-2xl mb-4 group-hover:text-gold transition-colors">
                  {s.title}
                </h3>
                <div className="flex items-center gap-3">
                  {s.authorAvatar ? (
                    <img src={s.authorAvatar} alt={s.author?.name}
                      className="w-8 h-8 rounded-full border border-gold/30 object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full border border-gold/30 bg-dark-card flex items-center justify-center text-gold text-xs font-bold">
                      {s.author?.name?.[0]?.toUpperCase() || 'A'}
                    </div>
                  )}
                  <span className="text-xs text-gray-500 font-montserrat uppercase tracking-tight">
                    {s.author?.name || 'LeadsHer Author'}
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>

        <div className="mt-14 text-center">
          <Link to="/stories" className="text-gold font-bold uppercase tracking-widest text-xs border-b border-gold pb-1 hover:text-white hover:border-white transition-all">
            View All Stories
          </Link>
        </div>
      </div>
    </section>
  );
}
