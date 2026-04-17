import { HomeBookSearch } from '@/components/home/home-book-search';
import { HomeHero } from '@/components/home/home-hero';
import { ScreenContainer } from '@/components/ui/screen-container';

export default function HomeScreen() {
  return (
    <ScreenContainer>
      <HomeBookSearch />
      <HomeHero />
    </ScreenContainer>
  );
}
