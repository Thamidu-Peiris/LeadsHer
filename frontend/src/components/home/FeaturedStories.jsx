import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { storyApi } from '../../api/storyApi';
import StoryCard from '../stories/StoryCard';
import Spinner from '../common/Spinner';

export default function FeaturedStories() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storyApi.getFeatured()
      .then((res) => setStories(res.data?.stories || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 flex justify-center"><Spinner /></div>
    </section>
  );

  if (!stories.length) return null;

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="section-title">Featured Stories</h2>
            <p className="section-subtitle">Inspiring journeys from women who are making a difference</p>
          </div>
          <Link to="/stories" className="btn-secondary text-sm hidden sm:inline-flex">View all →</Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.slice(0, 3).map((s) => <StoryCard key={s._id} story={s} />)}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link to="/stories" className="btn-secondary">View all stories</Link>
        </div>
      </div>
    </section>
  );
}
