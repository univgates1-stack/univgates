import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CalendarClock, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ComingSoon = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 pt-40 pb-24">
        <section className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center space-y-10">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mx-auto">
              <CalendarClock className="h-8 w-8" />
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold">Agent Program Coming Soon</h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                We’re building a dedicated experience for our recruitment partners. Leave your details and be the
                first to know when the agent registration portal launches.
              </p>
            </div>
            <div className="space-y-6">
              <Button
                size="lg"
                className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-soft"
                asChild
              >
                <a href="mailto:info@univgates.com">Contact Our Partnerships Team</a>
              </Button>
              <div>
                <Button variant="ghost" onClick={() => navigate(-1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ComingSoon;
