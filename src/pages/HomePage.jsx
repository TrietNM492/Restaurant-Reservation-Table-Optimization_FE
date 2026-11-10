import { useLocation } from 'react-router-dom';
import { Alert, Box, Container } from '@mui/material';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/home/HeroSection';
import FeaturedRestaurants from '../components/home/FeaturedRestaurants';
import DiningCategories from '../components/home/DiningCategories';
import BenefitsSection from '../components/home/BenefitsSection';
import HowItWorks from '../components/home/HowItWorks';
import TestimonialsSection from '../components/home/TestimonialsSection';
import FinalCTA from '../components/home/FinalCTA';

function HomePage() {
  const { state } = useLocation();

  return (
    <Box sx={{ minHeight: '100vh', background: '#FFFFFF' }}>
      <Navbar />
      {state?.logoutError && (
        <Alert severity="warning" sx={{ borderRadius: 0 }}>
          {state.logoutError}
        </Alert>
      )}
      <main>
        <HeroSection />
        <Container maxWidth="xl">
          <FeaturedRestaurants />
          <DiningCategories />
          <BenefitsSection />
          <HowItWorks />
          <TestimonialsSection />
        </Container>
        <FinalCTA />
      </main>
      <Footer />
    </Box>
  );
}

export default HomePage;
