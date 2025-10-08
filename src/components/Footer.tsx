<<<<<<< HEAD
import Logo from "@/components/Logo";
import { Linkedin, Facebook, Mail, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();

=======
import { Linkedin, Facebook, Mail, Phone } from "lucide-react";

const Footer = () => {
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Company Information */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
<<<<<<< HEAD
              <Logo
                className="gap-3"
                imgClassName="w-10 h-10"
                textClassName="hidden sm:inline text-2xl font-bold text-background"
              />
            </div>
            <p className="text-background/80 mb-6 max-w-md leading-relaxed">
              {t("landing.footer.description")}
=======
              <img 
                src="/UnivGates-Logo.png" 
                alt="UnivGates Logo" 
                className="w-10 h-10"
              />
              <span className="text-2xl font-bold">UnivGates</span>
            </div>
            <p className="text-background/80 mb-6 max-w-md leading-relaxed">
              Your gateway to Turkish universities. Powered by Academia Group, we connect 
              international students with top-tier educational institutions across Turkey, 
              making your educational dreams accessible and achievable.
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
            </p>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="p-2 bg-background/10 rounded-lg hover:bg-background/20 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="p-2 bg-background/10 rounded-lg hover:bg-background/20 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Company Links */}
          <div>
<<<<<<< HEAD
            <h3 className="font-semibold text-lg mb-6">{t("landing.footer.company")}</h3>
            <ul className="space-y-3">
              <li>
                <a href="/about" className="text-background/80 hover:text-background transition-colors">
                  {t("landing.footer.links.about")}
=======
            <h3 className="font-semibold text-lg mb-6">Company</h3>
            <ul className="space-y-3">
              <li>
                <a href="/about" className="text-background/80 hover:text-background transition-colors">
                  About Us
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
                </a>
              </li>
              <li>
                <a href="/careers" className="text-background/80 hover:text-background transition-colors">
<<<<<<< HEAD
                  {t("landing.footer.links.careers")}
=======
                  Careers
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
                </a>
              </li>
              <li>
                <a href="/partners" className="text-background/80 hover:text-background transition-colors">
<<<<<<< HEAD
                  {t("landing.footer.links.partners")}
=======
                  University Partners
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
                </a>
              </li>
              <li>
                <a href="/news" className="text-background/80 hover:text-background transition-colors">
<<<<<<< HEAD
                  {t("landing.footer.links.news")}
=======
                  News & Updates
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
                </a>
              </li>
            </ul>
          </div>

          {/* Help & Support */}
          <div>
<<<<<<< HEAD
            <h3 className="font-semibold text-lg mb-6">{t("landing.footer.help")}</h3>
            <ul className="space-y-3 mb-6">
              <li>
                <a href="/faq" className="text-background/80 hover:text-background transition-colors">
                  {t("landing.footer.helpLinks.faq")}
=======
            <h3 className="font-semibold text-lg mb-6">Help & Support</h3>
            <ul className="space-y-3 mb-6">
              <li>
                <a href="/faq" className="text-background/80 hover:text-background transition-colors">
                  FAQ
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
                </a>
              </li>
              <li>
                <a href="/contact" className="text-background/80 hover:text-background transition-colors">
<<<<<<< HEAD
                  {t("landing.footer.helpLinks.contact")}
=======
                  Contact Us
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
                </a>
              </li>
              <li>
                <a href="/support" className="text-background/80 hover:text-background transition-colors">
<<<<<<< HEAD
                  {t("landing.footer.helpLinks.support")}
=======
                  Student Support
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
                </a>
              </li>
              <li>
                <a href="/guides" className="text-background/80 hover:text-background transition-colors">
<<<<<<< HEAD
                  {t("landing.footer.helpLinks.guides")}
=======
                  Application Guides
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
                </a>
              </li>
            </ul>
            
            {/* Contact Info */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-background/80">
                <Mail className="h-4 w-4" />
<<<<<<< HEAD
                <span className="text-sm">{t("landing.footer.contact.email")}</span>
              </div>
              <div className="flex items-center space-x-2 text-background/80">
                <Phone className="h-4 w-4" />
                <span className="text-sm">{t("landing.footer.contact.phone")}</span>
=======
                <span className="text-sm">info@univgates.com</span>
              </div>
              <div className="flex items-center space-x-2 text-background/80">
                <Phone className="h-4 w-4" />
                <span className="text-sm">+90 212 555 0123</span>
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
              </div>
            </div>
          </div>
        </div>

        {/* Legal Links */}
        <div className="border-t border-background/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-wrap gap-6 text-sm">
              <a href="/privacy" className="text-background/80 hover:text-background transition-colors">
<<<<<<< HEAD
                {t("landing.footer.legal.privacy")}
              </a>
              <a href="/terms" className="text-background/80 hover:text-background transition-colors">
                {t("landing.footer.legal.terms")}
              </a>
              <a href="/cookies" className="text-background/80 hover:text-background transition-colors">
                {t("landing.footer.legal.cookies")}
              </a>
            </div>
            <div className="text-sm text-background/80">
              {t("landing.footer.copyright")}
=======
                Privacy Policy
              </a>
              <a href="/terms" className="text-background/80 hover:text-background transition-colors">
                Terms of Service
              </a>
              <a href="/cookies" className="text-background/80 hover:text-background transition-colors">
                Cookie Policy
              </a>
            </div>
            <div className="text-sm text-background/80">
              © 2024 Academia Group. All rights reserved.
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

<<<<<<< HEAD
export default Footer;
=======
export default Footer;
>>>>>>> 5a8061baf3691b48b7795edb34ec7d1edb8b4051
