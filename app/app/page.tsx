"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Globe,
  ArrowRight,
  Play,
  Menu,
  X,
  Users,
  Star,
  Heart,
  Stethoscope,
  Pill,
  Video,
  MapPin,
  CheckCircle,
  ArrowUp,
  Clock,
  Send,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getDiceBearAvatar = (seed: string) => {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
  };

  const navItems = [
    { label: "How it Works", href: "#how-it-works" },
    { label: "Find Doctors", href: "#find-doctors" },
    { label: "Features", href: "#features" },
    { label: "About", href: "#about" },
  ];

  const features = [
    {
      icon: Video,
      title: "Virtual Consultations",
      description:
        "Connect with certified doctors through secure video calls from anywhere in the world",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: Shield,
      title: "Blockchain Security",
      description:
        "Your medical records are encrypted and stored securely on the Solana blockchain",
      color: "from-green-500 to-green-600",
    },
    {
      icon: Pill,
      title: "Medication Delivery",
      description:
        "Get prescribed medications delivered directly to your doorstep within hours",
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: Globe,
      title: "Global Access",
      description:
        "Access healthcare services across borders with our international network",
      color: "from-orange-500 to-orange-600",
    },
  ];

  const howItWorksSteps = [
    {
      step: "01",
      title: "Sign Up Easily",
      description:
        "Create your account using email or Google - no complex wallet setup required",
      icon: User,
    },
    {
      step: "02",
      title: "Find Your Doctor",
      description:
        "Browse verified doctors or use our AI assistant to find the right specialist",
      icon: Users,
    },
    {
      step: "03",
      title: "Secure Consultation",
      description:
        "Have your video consultation with end-to-end encryption and blockchain verification",
      icon: Video,
    },
    {
      step: "04",
      title: "Get Treatment",
      description:
        "Receive prescriptions and get medications delivered to your location",
      icon: Heart,
    },
  ];

  const stats = [
    { number: "50K+", label: "Active Patients", icon: Users },
    { number: "2,500+", label: "Verified Doctors", icon: Stethoscope },
    { number: "100K+", label: "Consultations", icon: Video },
    { number: "45+", label: "Countries", icon: Globe },
  ];

  const testimonials = [
    {
      name: "Dr. Adaora Okafor",
      role: "Cardiologist, Lagos",
      content:
        "teleHealthSol has revolutionized how I connect with patients across Nigeria. The blockchain security gives both me and my patients peace of mind.",
      avatar: getDiceBearAvatar("adaora"),
      rating: 5,
    },
    {
      name: "Amara Okonkwo",
      role: "Patient, Abuja",
      content:
        "I was able to consult with a specialist in London from my home in Abuja. The medication delivery was fast and reliable.",
      avatar: getDiceBearAvatar("amara"),
      rating: 5,
    },
    {
      name: "Dr. Kemi Adebayo",
      role: "Dermatologist, Port Harcourt",
      content:
        "The platform's AI triage system helps me focus on patients who need my expertise most. It's incredibly efficient.",
      avatar: getDiceBearAvatar("kemi"),
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 overflow-x-hidden transition-colors duration-300">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-md z-50 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center space-x-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Link href="/" className="flex items-center space-x-2">
                <Image
                  src="/telehealthlogowithtext.svg"
                  alt="teleHealthSol"
                  width={150}
                  height={40}
                  className="h-8 w-auto"
                />
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item, index) => (
                <motion.button
                  key={item.label}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => scrollToSection(item.href.slice(1))}
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
                >
                  {item.label}
                </motion.button>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="hidden md:flex items-center space-x-3">
                  <Link href="/signin">
                    <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white">
                      Sign In
                    </Button>
                  </Link>
                </div>
              </motion.div>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden mt-4 pb-4 border-t border-gray-200 dark:border-gray-700"
              >
                <div className="flex flex-col space-y-4 pt-4">
                  {navItems.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => scrollToSection(item.href.slice(1))}
                      className="text-left text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
                    >
                      {item.label}
                    </button>
                  ))}
                  <div className="flex flex-col space-y-2 pt-2">
                    <Link href="/signin">
                      <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white w-full">
                        Sign In
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left"
            >
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight font-heading">
                Healthcare{" "}
                <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  without
                </span>
                <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent block">
                  Borders
                </span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl">
                Connect with world-class doctors from anywhere. Secure your
                medical records on blockchain. Get medications delivered to your
                doorstep.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center mb-12">
                <Link href="/signin">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-8 py-4 text-lg"
                  >
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 py-4 text-lg"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Watch Demo
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center">
                  <Shield className="w-4 h-4 mr-2 text-green-600" />
                  Blockchain Secured
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                  Verified Doctors
                </div>
                <div className="flex items-center">
                  <Globe className="w-4 h-4 mr-2 text-purple-600" />
                  Global Access
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative z-10">
                <iframe
                  src="/online-doctor-animate.svg"
                  className="w-full h-auto max-w-lg mx-auto"
                  style={{ minHeight: "500px" }}
                  title="Online Doctor Consultation"
                  frameBorder="0"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-green-400/20 rounded-full blur-3xl"></div>
            </motion.div>

            {/* Stats Section */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 lg:col-span-2"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  className="text-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stat.number}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 font-heading">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Get started with teleHealthSol in four simple steps and experience
              the future of healthcare
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorksSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-0 bg-white dark:bg-gray-900">
                  <CardContent className="p-8 text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <step.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-sm font-bold text-blue-600 mb-2">
                      STEP {step.step}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>

                {/* Connection Line */}
                {index < howItWorksSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-blue-600 to-green-600 transform -translate-y-1/2"></div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Find Doctors Section */}
      <section
        id="find-doctors"
        className="py-20 bg-white dark:bg-gray-900 relative overflow-hidden"
      >
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-blue-400 to-green-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-gradient-to-r from-green-400 to-blue-400 rounded-full blur-2xl"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 font-heading">
              Find Your Perfect Doctor
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Connect with verified healthcare professionals from around the
              world, specialized in your specific needs
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Verified Professionals
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      All our doctors are licensed, verified, and have extensive
                      experience in their specialties
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      24/7 Availability
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Access healthcare whenever you need it with doctors
                      available around the clock
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Global Network
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Connect with specialists from leading medical institutions
                      worldwide
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <Button
                  size="lg"
                  onClick={() => scrollToSection("cta")}
                  className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white"
                >
                  Explore Doctors
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-900/10 dark:to-green-900/10 rounded-2xl p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Stethoscope className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Meet Our Doctors
                  </h3>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      name: "Dr. Sarah Johnson",
                      specialty: "Cardiologist",
                      rating: 4.9,
                      location: "London, UK",
                    },
                    {
                      name: "Dr. Ahmed Hassan",
                      specialty: "Pediatrician",
                      rating: 4.8,
                      location: "Cairo, Egypt",
                    },
                    {
                      name: "Dr. Maria Santos",
                      specialty: "Dermatologist",
                      rating: 4.9,
                      location: "São Paulo, Brazil",
                    },
                  ].map((doctor, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage
                            src={
                              getDiceBearAvatar(doctor.name.toLowerCase()) ||
                              "/placeholder.svg"
                            }
                          />
                          <AvatarFallback>
                            {doctor.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {doctor.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {doctor.specialty}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                            <span className="text-sm font-medium">
                              {doctor.rating}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {doctor.location}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-20 bg-gray-50 dark:bg-gray-800 relative overflow-hidden"
      >
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 right-20 w-36 h-36 bg-gradient-to-r from-blue-400 to-green-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-20 w-28 h-28 bg-gradient-to-r from-green-400 to-purple-400 rounded-full blur-2xl"></div>
          <div className="absolute top-1/3 right-1/4 w-20 h-20 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full blur-xl"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 font-heading">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Experience healthcare like never before with our cutting-edge
              technology and comprehensive services
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 border-0 bg-white dark:bg-gray-900 group">
                  <CardContent className="p-8 text-center">
                    <div
                      className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 font-heading">
              What Our Community Says
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Hear from doctors and patients who are transforming healthcare
              with teleHealthSol
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-8">
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-5 h-5 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-6 italic">
                      &quot;{testimonial.content}&quot;
                    </p>
                    <div className="flex items-center">
                      <Avatar className="w-12 h-12 mr-4">
                        <AvatarImage
                          src={testimonial.avatar || "/placeholder.svg"}
                        />
                        <AvatarFallback>
                          {testimonial.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {testimonial.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section
        id="about"
        className="py-20 bg-gray-50 dark:bg-gray-800 relative overflow-hidden"
      >
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-16 left-16 w-32 h-32 bg-gradient-to-r from-green-400 to-blue-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-16 right-16 w-40 h-40 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-3xl"></div>
          <div className="absolute top-2/3 left-1/2 w-24 h-24 bg-gradient-to-r from-purple-400 to-green-400 rounded-full blur-2xl"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 font-heading">
              About teleHealthSol
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Revolutionizing healthcare access in developing nations through
              blockchain technology
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Globe className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Global Healthcare Access
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    We&apos;re bridging the healthcare gap in developing nations
                    by connecting patients with world-class doctors through
                    blockchain technology.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Secure & Transparent
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Your medical records are encrypted and stored on the Solana
                    blockchain, ensuring privacy and security while maintaining
                    accessibility.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Heart className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Our Mission
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    To make quality healthcare accessible to everyone,
                    everywhere, by leveraging blockchain technology and
                    connecting patients with the best medical professionals.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-900/10 dark:to-green-900/10 rounded-2xl p-8">
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Globe className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Global Reach
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        45+ Countries
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                      <Stethoscope className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Expert Doctors
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        2,500+ Verified Professionals
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                      <Pill className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Medication Delivery
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Fast & Reliable Service
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="py-20 bg-gradient-to-r from-blue-600 to-green-600"
        id="cta"
      >
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-heading">
              Ready to Transform Your Healthcare?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join the revolution in digital healthcare. Connect with doctors,
              secure your records, and get the care you deserve.
            </p>
            <Link href="/signin">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg"
              >
                Get Started Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Image
                  src="/telehealthlogowithtext.svg"
                  alt="teleHealthSol"
                  width={150}
                  height={40}
                  className="h-8 w-auto"
                />
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Revolutionizing healthcare access through blockchain technology,
                connecting patients with world-class doctors across borders.
              </p>
              <div className="flex space-x-4">
                <a
                  href="https://x.com/teleHealthS0l"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-white"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://t.me/+AyXlku_fTwA2ZGJk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
                >
                  <Send className="w-5 h-5 text-white" />
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Find Doctors
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Book Consultation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Medical Records
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Medication Delivery
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="flex flex-col space-y-2">
              <p className="text-gray-400 text-sm">
                © {currentYear} teleHealthSol. All rights reserved.
              </p>
              <p className="text-gray-500 text-xs">
                Illustrations by{" "}
                <a
                  href="https://storyset.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gray-300 transition-colors"
                >
                  Storyset
                </a>
              </p>
            </div>
            <div className="flex items-center mt-4 md:mt-0">
              <span className="text-gray-400 text-sm">Powered by</span>
              <div className="flex items-center">
                <Image
                  src="/solanaLogo.png"
                  width={16}
                  height={16}
                  alt="Solana"
                  className="w-16 h-16"
                />
                <span className="text-sm font-semibold">Solana</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 w-12 h-12 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow z-50"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
