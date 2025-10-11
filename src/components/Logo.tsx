import { cn } from "@/lib/utils";

interface LogoProps {
  href?: string;
  className?: string;
  imgClassName?: string;
  textClassName?: string;
  showText?: boolean;
  text?: string;
}

const Logo = ({
  href = '/',
  className,
  imgClassName,
  textClassName,
  showText = true,
  text = 'UnivGates',
}: LogoProps) => {
  return (
    <a
      href={href}
      className={cn(
        'flex items-center hover:opacity-80 transition-opacity shrink-0',
        className
      )}
    >
      <img
        src="/UnivGates-Logo.png"
        alt="UnivGates Logo"
        className={cn('w-10 h-10 shrink-0', imgClassName)}
      />
      {showText && (
        <span
          className={cn(
            'hidden sm:inline font-bold text-foreground whitespace-nowrap',
            textClassName
          )}
        >
          {text}
        </span>
      )}
    </a>
  );
};

export default Logo;
