import { Box } from '@mui/material';
import SectionHeading from '../common/SectionHeading';
import RestaurantCard from './RestaurantCard';
import { restaurants } from '../../data/restaurants';

function FeaturedRestaurants() {
  return (
    <Box component="section" sx={{ py: { xs: 6, md: 8 } }}>
      <SectionHeading
        eyebrow="Curated picks"
        title="Discover Restaurants You'll Love"
        subtitle="Explore memorable dining experiences for every occasion."
        align="center"
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }, gap: 3 }}>
        {restaurants.map((restaurant) => (
          <RestaurantCard key={restaurant.id} restaurant={restaurant} />
        ))}
      </Box>
    </Box>
  );
}

export default FeaturedRestaurants;
