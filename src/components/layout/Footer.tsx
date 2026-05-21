"use client";

import Image from "next/image";
import { Link } from "@/navigation";
import {
  Instagram,
  Facebook,
  Youtube,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  ArrowRight,
} from "lucide-react";

export default function Footer() {
  const socialLinks = [
    {
      name: "Instagram",
      icon: Instagram,
      href: "https://www.instagram.com/Deeshora?igsh=MXJtemRwYXA5Y3VxZg%3D%3D&utm_source=qr",
      color: "hover:text-pink-500",
    },
    {
      name: "Facebook",
      icon: Facebook,
      href: "https://www.facebook.com/share/Deeshora/?mibextid=wwXIfr",
      color: "hover:text-blue-600",
    },
    {
      name: "YouTube",
      icon: Youtube,
      href: "https://www.youtube.com/@Deeshora",
      color: "hover:text-red-600",
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      href: "https://wa.me/918939318865",
      color: "hover:text-emerald-500",
    },
  ];

  const quickLinks = [
    { name: "Home", href: "/" },
    { name: "Browse Products", href: "/search" },
    { name: "Communities", href: "/communities" },
  ];

  const supportLinks = [
    { name: "My Orders", href: "/orders" },
    { name: "My Cart", href: "/cart" },
    { name: "Help Center", href: "/help" },
    { name: "Privacy Policy", href: "/privacy" },
  ];

  return (
    <footer className="relative z-10 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-900 pt-20 pb-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Section */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-12 h-12">
                <Image
                  src="/logo.jpg"
                  alt="Deeshora Logo"
                  fill
                  className="object-cover rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="flex flex-col -space-y-1">
                <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
                  Deeshora
                </span>
                <span className="text-[10px] font-black text-brand-500 uppercase tracking-[0.2em]">
                  North Chennai&apos;s Own Daily 1Mart
                </span>
              </div>
            </Link>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed font-medium">
              North Chennai&apos;s favorite Daily 1Mart. Get 1% cashback on every purchase directly credited to your wallet.
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 ${social.color} transition-all hover:scale-110 hover:shadow-xl group active:scale-95`}
                  aria-label={social.name}
                >
                  <social.icon
                    size={20}
                    className="group-hover:animate-pulse"
                  />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-gray-900 dark:text-white font-black uppercase tracking-widest text-xs mb-8">
              Shop With Us
            </h4>
            <ul className="space-y-4">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-500 dark:text-gray-400 hover:text-brand-500 dark:hover:text-brand-500 text-sm font-bold transition-colors flex items-center gap-2 group"
                  >
                    <ArrowRight
                      size={14}
                      className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all"
                    />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-gray-900 dark:text-white font-black uppercase tracking-widest text-xs mb-8">
              Support & Care
            </h4>
            <ul className="space-y-4">
              {supportLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-500 dark:text-gray-400 hover:text-brand-500 dark:hover:text-brand-500 text-sm font-bold transition-colors flex items-center gap-2 group"
                  >
                    <ArrowRight
                      size={14}
                      className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all"
                    />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-gray-900 dark:text-white font-black uppercase tracking-widest text-xs mb-8">
              Get In Touch
            </h4>
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-brand-500 flex-shrink-0">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">
                    Call Us
                  </p>
                  <a
                    href="tel:+919489505295"
                    className="text-sm font-bold text-gray-900 dark:text-white hover:text-brand-500 transition-colors tracking-tight"
                  >
                    +91 94895 05295
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-brand-500 flex-shrink-0">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">
                    Email Us
                  </p>
                  <a
                    href="mailto:support@Deeshora.in"
                    className="text-sm font-bold text-gray-900 dark:text-white hover:text-brand-500 transition-colors tracking-tight"
                  >
                    support@Deeshora.in
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-brand-500 flex-shrink-0">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">
                    Visit Us
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">
                    North Chennai, Tamil Nadu, India
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-gray-100 dark:border-gray-900 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm font-bold text-gray-400 tracking-tight">
            &copy; {new Date().getFullYear()}{" "}
            <span className="text-gray-900 dark:text-white">Deeshora Tech</span>
            . All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              System Operational
            </div>
            <p className="text-xs font-bold text-gray-400">
              Made with ❤️ by Deeshora
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
