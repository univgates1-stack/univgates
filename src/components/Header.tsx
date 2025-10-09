import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Users, GraduationCap, Building2, Check } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

const Header = () => {
  const { t, i18n } = useTranslation();
  const currentLanguage = useMemo(() => i18n.language.split("-")[0], [i18n.language]);

  const languageOptions = useMemo(
    () => [
      { code: "en", label: t("landing.header.languageOptions.en"), flag: "🇺🇸" },
      { code: "tr", label: t("landing.header.languageOptions.tr"), flag: "🇹🇷" },
    ],
    [t]
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo/Brand Name */}
          <Logo className="gap-3" textClassName="hidden sm:inline text-2xl font-bold text-foreground" />

          {/* Language Switcher & CTA */}
          <div className="flex items-center space-x-3 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center space-x-2 bg-card">
                  <span className="font-medium uppercase">{currentLanguage}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border border-border">
                {languageOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.code}
                    onSelect={() => i18n.changeLanguage(option.code)}
                    className="cursor-pointer flex items-center justify-between"
                  >
                    <span className="flex items-center space-x-2">
                      <span>{option.flag}</span>
                      <span>{option.label}</span>
                    </span>
                    {currentLanguage === option.code && <Check className="h-4 w-4" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-soft px-6 py-2 font-medium">
                  {t("landing.header.getStarted")}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border border-border w-56">
                <DropdownMenuItem asChild className="cursor-pointer">
                  <a href="/auth-new" className="flex items-center">
                    <GraduationCap className="h-4 w-4 mr-3" />
                    <div>
                      <div className="font-medium">{t("landing.header.studentRegistration")}</div>
                      <div className="text-xs text-muted-foreground">{t("landing.header.studentRegistrationDescription")}</div>
                    </div>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <a href="/register/university-official" className="flex items-center">
                    <Building2 className="h-4 w-4 mr-3" />
                    <div>
                      <div className="font-medium">{t("landing.header.universityRegistration")}</div>
                      <div className="text-xs text-muted-foreground">{t("landing.header.universityRegistrationDescription")}</div>
                    </div>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <a href="/auth-new?tab=agent" className="flex items-center">
                    <Users className="h-4 w-4 mr-3" />
                    <div>
                      <div className="font-medium">{t("landing.header.agentRegistration")}</div>
                      <div className="text-xs text-muted-foreground">{t("landing.header.agentRegistrationDescription")}</div>
                    </div>
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
