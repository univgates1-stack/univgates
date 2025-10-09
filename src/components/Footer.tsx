import Logo from "@/components/Logo";
import { Linkedin, Facebook, Mail, Phone, Instagram, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Company Information */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <Logo
                className="gap-3"
                imgClassName="w-10 h-10"
                textClassName="hidden sm:inline text-2xl font-bold text-background"
              />
            </div>
            <p className="text-background/80 mb-6 max-w-md leading-relaxed">
              {t("landing.footer.description")}
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://www.linkedin.com/company/academia-group" 
                className="p-2 bg-background/10 rounded-lg hover:bg-background/20 transition-colors"
                aria-label="LinkedIn"
                target="_blank"
                rel="noreferrer"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a 
                href="https://www.facebook.com/academiagroup" 
                className="p-2 bg-background/10 rounded-lg hover:bg-background/20 transition-colors"
                aria-label="Facebook"
                target="_blank"
                rel="noreferrer"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://www.instagram.com/academiagroups?igsh=MWRhYmgzMThnd210eg=="
                className="p-2 bg-background/10 rounded-lg hover:bg-background/20 transition-colors"
                aria-label="Instagram"
                target="_blank"
                rel="noreferrer"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold text-lg mb-6">{t("landing.footer.company")}</h3>
            <ul className="space-y-3">
              <li>
                <a href="/about" className="text-background/80 hover:text-background transition-colors">
                  {t("landing.footer.links.about")}
                </a>
              </li>
              <li>
                <a href="/careers" className="text-background/80 hover:text-background transition-colors">
                  {t("landing.footer.links.careers")}
                </a>
              </li>
              <li>
                <a href="/partners" className="text-background/80 hover:text-background transition-colors">
                  {t("landing.footer.links.partners")}
                </a>
              </li>
              <li>
                <a href="/news" className="text-background/80 hover:text-background transition-colors">
                  {t("landing.footer.links.news")}
                </a>
              </li>
            </ul>
          </div>

          {/* Help & Support */}
          <div>
            <h3 className="font-semibold text-lg mb-6">{t("landing.footer.help")}</h3>
            <ul className="space-y-3 mb-6">
              <li>
                <a href="/faq" className="text-background/80 hover:text-background transition-colors">
                  {t("landing.footer.helpLinks.faq")}
                </a>
              </li>
              <li>
                <a href="/contact" className="text-background/80 hover:text-background transition-colors">
                  {t("landing.footer.helpLinks.contact")}
                </a>
              </li>
              <li>
                <a href="/support" className="text-background/80 hover:text-background transition-colors">
                  {t("landing.footer.helpLinks.support")}
                </a>
              </li>
              <li>
                <a href="/guides" className="text-background/80 hover:text-background transition-colors">
                  {t("landing.footer.helpLinks.guides")}
                </a>
              </li>
            </ul>
            
            {/* Contact Info */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-background/80">
                <Mail className="h-4 w-4" />
                <span className="text-sm">{t("landing.footer.contact.email")}</span>
              </div>
              <div className="flex items-center space-x-2 text-background/80">
                <Phone className="h-4 w-4" />
                <span className="text-sm">{t("landing.footer.contact.phone")}</span>
              </div>
              <div className="flex items-center space-x-2 text-background/80">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{t("landing.footer.contact.address")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Legal Links */}
        <div className="border-t border-background/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-wrap gap-6 text-sm">
              <a href="/privacy" className="text-background/80 hover:text-background transition-colors">
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
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
