import Hero from '../components/home/Hero';
import FeaturedStories from '../components/home/FeaturedStories';
import UpcomingEvents from '../components/home/UpcomingEvents';
import CallToAction from '../components/home/CallToAction';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <FeaturedStories />
      <UpcomingEvents />
      <CallToAction />
    </main>
  );
}
