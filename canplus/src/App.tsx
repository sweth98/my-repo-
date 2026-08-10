import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import TrustBar from "./components/TrustBar";
import Ecosystem from "./components/Ecosystem";
import AIStack from "./components/AIStack";
import LearnerExperience from "./components/LearnerExperience";
import InstructorExperience from "./components/InstructorExperience";
import Labs from "./components/Labs";
import Stage from "./components/Stage";
import Credentials from "./components/Credentials";
import Catalogue from "./components/Catalogue";
import Deployment from "./components/Deployment";
import Integrations from "./components/Integrations";
import CaseStudies from "./components/CaseStudies";
import WhyCanPlus from "./components/WhyCanPlus";
import Security from "./components/Security";
import CTA from "./components/CTA";
import Footer from "./components/Footer";

export default function App() {
  return (
    <>
      <Navbar />
      <main id="main">
        <Hero />
        <TrustBar />

        {/* The platform story: journey → AI → the three audiences */}
        <Ecosystem />
        <AIStack />
        <LearnerExperience />
        <InstructorExperience />

        {/* What learners actually do in it */}
        <Labs />
        <Stage />
        <Credentials />
        <Catalogue />

        {/* The institutional story */}
        <Deployment />
        <Integrations />
        <CaseStudies />
        <WhyCanPlus />
        <Security />

        <CTA />
      </main>
      <Footer />
    </>
  );
}
