import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useTranslation } from "react-i18next";

const Terms = () => {
  const { i18n } = useTranslation();
  const locale = i18n.language?.toLowerCase().startsWith("tr") ? "tr" : "en";
  const Content = locale === "tr" ? TurkishTerms : EnglishTerms;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 pt-32 pb-16">
        <section className="container mx-auto px-6">
          <article className="max-w-4xl mx-auto space-y-10">
            <Content />
          </article>
        </section>
      </main>
      <Footer />
    </div>
  );
};

const EnglishTerms = () => (
  <>
    <header className="space-y-4 text-center">
      <h1 className="text-4xl font-bold">Terms of Service</h1>
      <p className="text-muted-foreground">
        Please review these terms carefully. By accessing or using the UnivGates platform,
        you agree to be bound by the provisions outlined below.
      </p>
    </header>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">1. Parties</h2>
      <p>
        This User Agreement is concluded between the User who becomes a member of or in any
        way uses the Platform defined below and Academia Group Eğitim Danışmanlık Ltd. Şti.,
        located at Merkez Mah. Marmara Cad. Ozan Bağcılar İş Merkezi No:27-29 Kat 3/56
        Avcılar/İstanbul (“Prospective Student – University – Partner Company and
        UnivGates”). This agreement applies to the univgates.com website, mobile
        applications (“University Preference,” “Preference Engine”), and exams relating to
        high school and university (high school and high school transition exam students)
        and/or legal entities. By accessing this mobile application and/or website or using
        any information within the application/website, you agree to the conditions below.
      </p>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">2. Definitions</h2>
      <ul className="space-y-3 list-disc pl-6">
        <li>
          <strong>Platform:</strong> The univgates.com website or UnivGates mobile
          applications.
        </li>
        <li>
          <strong>User or Users:</strong> Real and/or legal persons who become members of
          the univgates.com website and mobile application offered by UnivGates and/or
          benefit from the services provided within the Platform under the conditions
          specified in this agreement, who provide mentoring services and/or access the
          Platform.
        </li>
        <li>
          <strong>Membership Account:</strong> The page exclusive to the User, accessed with
          a username and password determined and used exclusively by the User, where the
          User performs the transactions necessary to benefit from the services offered
          within the Platform, submits requests to UnivGates regarding membership or the
          services offered, updates membership information, and views reports on the services
          provided; created by clicking “Complete Membership,” “Sign Up with Google,” “Sign
          Up with Facebook,” or by accessing via at least one of the User’s Google, Facebook,
          or similar accounts where permitted by the Platform. For universities, membership
          accounts are created only through official university emails and contact details
          and official bank accounts unique to the university (even if authorized, personal
          emails, bank accounts, or personal information may not be used; only official
          university information/contacts/emails or university bank account numbers may be
          used). Personal accounts uploaded are under the responsibility of the university
          representative. The Platform is not obliged to review memberships and is merely an
          intermediary.
        </li>
        <li>
          <strong>Administrators:</strong> Persons authorized by UnivGates.
        </li>
        <li>
          <strong>Mentoring Service:</strong> One-to-one communication between real persons
          added to the Platform as mentors by UnivGates. The communication channel is only
          via the system and, after acceptance, may be video or text.
        </li>
        <li>
          <strong>Database:</strong> The database owned by UnivGates, protected under Law
          No. 5846 on Intellectual and Artistic Works, where content accessed within the
          Platform is stored, classified, queried, and accessed; it is deleted upon
          completion of processing.
        </li>
      </ul>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">3. Subject and Scope of the Agreement</h2>
      <p>
        The subject of this agreement is to determine the rights and obligations of the
        parties regarding the services offered on the Platform where users come together and
        the conditions for benefiting from these services. By accepting the provisions of
        this agreement, the User also accepts any and all statements made by UnivGates
        regarding use, membership, and all services within the Platform.
      </p>
      <p>The User accepts, declares, and undertakes to act in accordance with such statements.</p>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">4. Conditions of Membership and Service Use</h2>
      <ol className="list-decimal space-y-3 pl-6">
        <li>
          To become a member of the Platform, the User must log in with at least one of
          their Facebook, Google, or other social media accounts integrated by UnivGates, or
          complete the registration form. Membership is finalized once UnivGates approves the
          application via email or telephone. Until approval, Users do not acquire the rights
          defined in this agreement.
        </li>
        <li>
          Users must be at least 14 years old; legal entities must be represented by an
          authorized individual; and Users must not have been suspended or banned by
          UnivGates. Applications that fail to meet these criteria do not grant membership
          rights even if the registration process is completed.
        </li>
        <li>
          UnivGates includes mentors in the Platform after an internal evaluation process.
          UnivGates assumes no responsibility for the competence of service providers or the
          services delivered by Users.
        </li>
        <li>
          UnivGates may terminate, suspend, or cancel any membership or this agreement at any
          time without notice or compensation.
        </li>
        <li>
          Access to the Platform is free of charge; however, certain paid services may be
          offered, and their use is at the discretion of the Users.
        </li>
        <li>
          UnivGates may modify or adapt services at any time to improve effectiveness. Rules
          and conditions related to such changes will be announced via the relevant web pages
          or mobile applications.
        </li>
        <li>
          Communication between UnivGates and Users is limited to student-focused topics such
          as education, university, career, and social life. Insulting, defamatory, racist,
          political, religious, sexual, harassing, or illegal communication is prohibited and
          outside UnivGates’ responsibility.
        </li>
        <li>
          UnivGates may record the service status and information of all Users and may
          communicate with third parties in physical or electronic environments using these
          records.
        </li>
        <li>
          UnivGates may share comments, document uploads, instant messages, and screenshots
          generated during sessions only with universities. Information such as a User’s
          email, phone number, name, profile details, and usage data may be analyzed and
          compiled for business development and software improvement purposes.
        </li>
        <li>
          UnivGates is not liable for delays or damages arising from server issues,
          university-related delays, outages, data loss, or cyberattacks affecting the
          services offered on the Platform.
        </li>
        <li>
          Users must keep their login credentials confidential. UnivGates is not responsible
          for disputes resulting from violations of this obligation; responsibility rests
          with the account owner or the person accessing the system.
        </li>
        <li>
          UnivGates is not obliged to verify the accuracy of Users’ basic information such as
          email, full name, passport, ID, photos, or documents.
        </li>
        <li>
          UnivGates may forward information or request forms collected through the web and
          mobile applications to universities and third-party stakeholders to ensure proper
          operation.
        </li>
        <li>
          UnivGates may display advertisements, promotions, and announcements belonging to
          UnivGates or third parties on any page of the Platform and in email messages.
          UnivGates is responsible only for the content of its own materials.
        </li>
        <li>
          Sections visited by Users, universities viewed, and searches made in preference
          tools may be analyzed by UnivGates, and resulting reports may be published on the
          website and social media channels.
        </li>
        <li>
          UnivGates accepts no responsibility for tuition fees. Users should verify their
          preferences through university websites and guides such as YKS or YÖK Atlas to
          avoid errors.
        </li>
      </ol>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">5. Rights and Obligations</h2>

      <h3 className="text-xl font-semibold">5.1. General Rights and Obligations of Users</h3>
      <ol className="list-decimal space-y-3 pl-6">
        <li>
          While completing membership procedures, using Platform services, or performing any
          transaction related to the services, Users accept in advance that they will comply
          with all provisions of this agreement, the rules specified for the relevant
          services on the Platform, and applicable legislation.
        </li>
        <li>
          UnivGates may disclose confidential/private/commercial information shared by Users
          to official authorities if required by mandatory legal provisions. Users may not
          claim compensation for such disclosures.
        </li>
        <li>
          Users are solely responsible for the security of the social media usernames and
          passwords used to access their UnivGates Membership Account. Users agree to:
          <ol className="list-decimal space-y-1 pl-6">
            <li>Select strong and secure passwords.</li>
            <li>Keep their passwords confidential.</li>
            <li>Not transfer any part of their account to others.</li>
            <li>Comply with laws and the terms of this agreement.</li>
          </ol>
        </li>
        <li>
          Users accept that the information and content they provide are accurate and lawful.
          UnivGates is not obliged to verify, guarantee, or ensure the legality of such
          content and cannot be held liable for inaccuracies.
        </li>
        <li>
          Users may not assign this agreement or any rights or obligations within it to third
          parties without UnivGates’ written consent.
        </li>
        <li>
          Users may use the Platform only for lawful purposes. They accept that they will not
          reproduce, copy, distribute, process, or upload content that infringes on the
          rights or property of UnivGates or third parties, nor compete with UnivGates
          directly or indirectly. UnivGates is not liable for damages suffered by third
          parties due to such unlawful activities.
        </li>
        <li>
          Information in the UnivGates database may not be copied, transferred to other
          databases, or opened to third-party access without written consent.
        </li>
        <li>
          UnivGates, its employees, and administrators bear no responsibility for mentoring
          services provided on the Platform. The accuracy and legality of third-party
          information or services are the responsibility of the providers.
        </li>
        <li>
          Without written permission from UnivGates, Users may not link to other websites or
          applications, share contact information, or provide links to external data within
          Platform transactions.
        </li>
        <li>
          Information supplied during membership may be shared with other Users after
          mentoring services are provided or when Users request to communicate. Mentors and
          Users may message each other, and UnivGates does not intervene in these
          communications and accepts no responsibility.
        </li>
      </ol>

      <h3 className="text-xl font-semibold">5.2. Rights and Obligations of UnivGates</h3>
      <ol className="list-decimal space-y-3 pl-6">
        <li>
          UnivGates undertakes to provide the services defined in this agreement and to
          maintain the technological infrastructure required. This is not an unlimited
          service commitment; UnivGates may suspend or terminate services without notice.
        </li>
        <li>
          Links may be provided to third-party websites, files, or content not under the
          control of UnivGates. These are for reference only, and UnivGates does not endorse
          or assume responsibility for their content.
        </li>
        <li>
          UnivGates reserves the right to change, restrict, or delete services and content on
          the Platform at any time.
        </li>
        <li>
          UnivGates may use and store membership-related information for user security,
          fulfillment of obligations, and statistical evaluations. By accepting this
          agreement, Users consent to such use.
        </li>
        <li>
          UnivGates may review, restrict, or remove content that violates the operation of
          the Platform, the law, contractual terms, the rights of others, or general morality,
          and may terminate the relevant User’s membership without notice.
        </li>
        <li>
          Users may contact info@univgates.com for technical support, requests, and
          complaints, and may access process information via introductory videos.
        </li>
        <li>
          UnivGates accepts no liability for transactions performed by Users on the Platform.
          If UnivGates is required to pay any amount or administrative fine, the responsible
          User must reimburse it immediately.
        </li>
        <li>
          UnivGates or its payment partners may temporarily suspend, block, or stop payment
          instruments suspected of security risk, including credit cards or bank transfers,
          without liability to Users or third parties.
        </li>
        <li>
          UnivGates or affiliated payment institutions may verify card limits before
          processing advertising-related payments.
        </li>
      </ol>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">
        6. UnivGates Services and Terms of Use
      </h2>

      <h3 className="text-xl font-semibold">6.1. General Service Framework</h3>
      <p>
        UnivGates provides a platform where Users can obtain information about educational
        services and communicate with educational institutions, other Users, and mentors in
        accordance with the conditions defined herein.
      </p>
      <p>
        When Users submit a contact form, their details may be shared with partner
        universities. By doing so, Users consent to receiving phone calls or emails from
        UnivGates and partner universities.
      </p>
      <p>Throughout the year, members can:</p>
      <ul className="space-y-2 list-disc pl-6">
        <li>Access university presentations.</li>
        <li>Join online video events.</li>
        <li>Receive internship announcements.</li>
        <li>Research undergraduate, graduate, and online programs.</li>
        <li>Read blog posts tailored to their interests.</li>
        <li>Compare universities across multiple dimensions.</li>
        <li>Consult universities and ask questions.</li>
        <li>Read user reviews about universities.</li>
        <li>Create preference lists for universities.</li>
        <li>
          Apply for scholarships through Scouting based on talents, interests, and
          achievements.
        </li>
        <li>Access detailed information about universities, cities, and departments.</li>
        <li>
          Submit information forms and register for programs at universities of interest.
        </li>
        <li>Request information directly from universities.</li>
      </ul>
      <p>
        Users continue to benefit from these privileges unless they request deletion of their
        membership.
      </p>
      <p>
        <strong>6.1.b.</strong> Users are responsible for all activities conducted through their
        UnivGates Membership Account and cannot dispute transactions by claiming they were not
        performed by them.
      </p>

      <h3 className="text-xl font-semibold">
        6.2. General Rights and Obligations of Users in UnivGates Services
      </h3>
      <ol className="list-decimal space-y-3 pl-6">
        <li>
          Users submit requests to purchase mentoring services or communicate with mentors
          via the Platform infrastructure.
        </li>
        <li>
          Users accept that UnivGates may introduce new service content and charge additional
          fees. In such cases, invoices will be sent electronically to the email address
          registered on the Platform. Users are responsible for fulfilling all legal
          obligations, including tax requirements. UnivGates is not a party to mentor-user
          communications and bears no liability for unlawful actions. Users consent to having
          their payment details stored by third-party payment service providers contracted by
          UnivGates for secure processing, and acknowledge that UnivGates is not responsible
          for security breaches within those systems.
        </li>
        <li>
          Users may access additional services announced on the Platform by fulfilling the
          conditions specified in the relevant sections.
        </li>
        <li>
          UnivGates provides no guarantee regarding the accuracy, completeness, or quality of
          services offered by mentors and is not liable for defective services.
        </li>
      </ol>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">7. Privacy Policy</h2>
      <div className="space-y-3">
        <p>
          <strong>7.a.</strong> UnivGates may request personal details such as name, age, and
          email address to deliver services. These data are used to fulfill the services and
          to analyze and store statistical information derived from Platform usage.
        </p>
        <p>
          <strong>7.b.</strong> Contact information submitted through membership forms may be
          shared with relevant third parties upon the User’s request.
        </p>
        <p>
          <strong>7.c.</strong> Information obtained through Scouting applications may be
          shared with partner institutions and organizations.
        </p>
        <p>
          <strong>7.ç.</strong> UnivGates does not use or sell information submitted via
          membership forms for purposes outside its activities without the User’s consent.
        </p>
        <p>
          <strong>7.d.</strong> UnivGates keeps statistical records of website and mobile
          application usage, including IP address, internet service provider, browser
          features, operating system, and entry/exit pages. These data are used solely for
          statistical purposes and remain anonymous.
        </p>
        <p>
          <strong>7.e.</strong> Third-party advertisements, promotions, or announcements may
          be published on the Platform and may include cookies.
        </p>
        <p>
          <strong>7.f.</strong> The Platform may contain links to external websites. UnivGates
          is not responsible for the content or privacy practices of linked sites.
        </p>
        <p>
          <strong>7.g.</strong> Cookies may be used to enhance the user experience. Users can
          manage cookies through browser settings.
        </p>
        <p>
          <strong>7.ğ.</strong> UnivGates may use cookies provided by Countly, Google
          Analytics, Google Tag Manager, and Facebook for business, software development,
          measurement, and evaluation purposes.
        </p>
        <p>
          <strong>7.h.</strong> Delivering services requires collecting, storing, using,
          processing, and transferring personal data. By continuing to use the Platform, Users
          consent to these activities. Personal data may be used to fulfill contractual
          obligations, maintain records, support reporting and analysis, improve performance,
          facilitate mentor communications, meet legal requirements, and develop UnivGates’
          services. Data may be shared with third parties when necessary.
        </p>
        <p>
          <strong>7.ı.</strong> Users declare that the information they share belongs to them
          and consent to its use for UnivGates’ operational purposes.
        </p>
        <p>
          <strong>7.i.</strong> Personal data may be transferred to service providers within
          or outside the country for the purposes specified in this agreement and in the
          Privacy Notice.
        </p>
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">8. Intellectual Property Rights</h2>
      <p>
        The overall appearance and design of the UnivGates website and mobile application,
        trademarks, logos, icons, technical data, software, sales systems, business methods,
        and business models, along with all related materials, are owned or licensed by
        UnivGates. Users agree to use these materials only for the duration of the agreement
        and in accordance with its terms. They may not copy, reproduce, sell, transfer,
        publicly disclose, modify, or reverse-engineer the materials, nor use them outside
        the scope of the agreement. These obligations remain valid even after termination.
      </p>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">9. Other Provisions</h2>
      <ol className="list-decimal space-y-3 pl-6">
        <li>
          <strong>Changes to the Agreement:</strong> UnivGates may amend this agreement at
          any time by announcing the changes on the Platform. The amended provisions take
          effect upon announcement, and the remaining provisions continue in force.
        </li>
        <li>
          <strong>Evidence:</strong> The parties agree that in any dispute, UnivGates’ books
          and records, computer records, database and server records, commercial records,
          fax messages, instant messaging correspondence, emails, and social media
          communications shall constitute valid, binding, conclusive, and exclusive evidence.
        </li>
        <li>
          <strong>Applicable Law and Jurisdiction:</strong> Turkish law applies to this
          agreement. Istanbul Courts and Enforcement Offices have jurisdiction over disputes.
        </li>
      </ol>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">
        Commercial Communication and Electronic Message Consent
      </h2>
      <p>
        By approving this form, you consent to receiving promotional, campaign, and
        informational messages sent electronically via phone, call centers, fax, automatic
        calling machines, smart voice recording systems, email, and SMS about the products
        offered through the UnivGates mobile application/website by UnivGates Teknoloji
        Sanayi ve Ticaret Anonim Şirketi (“UnivGates”) or authorized intermediary companies,
        pursuant to Law No. 6563 on the Regulation of Electronic Commerce and the Regulation
        on Commercial Communication and Commercial Electronic Messages. You may unsubscribe
        from these messages at any time through the method indicated.
      </p>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Delivery and Refund Terms</h2>
      <p>
        Customers may cancel purchased packages within eight hours without penalty. Service
        providers may also cancel within the same timeframe. UnivGates is not responsible for
        payments made outside the system. Once the service is approved by the university, it
        cannot be canceled, and the university’s procedures apply. For erroneous charges
        related to canceled packages, contact info@univgates.com.
      </p>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Cookie Policy</h2>
      <p>
        UnivGates uses cookies to ensure the functionality of the website and mobile
        applications, personalize content and advertisements, analyze traffic, and understand
        how Users interact with the Platform. By clicking “Accept all cookies,” you consent
        to the use of cookies for these purposes.
      </p>
      <p>
        Cookies are simple text files placed in your browser by the websites you visit. They
        do not contain personal data and are used to store session information anonymously so
        that services can be tailored to your preferences.
      </p>
      <p>
        Cookies used by UnivGates include Google Analytics, Google Tag Manager, Facebook,
        Countly, and location-based cookies to keep currency and pricing information up to
        date. You can manage cookies through your browser settings, reject them entirely,
        receive warnings before they are stored, allow cookies from specific sites, or delete
        previously accepted cookies. To opt out of third-party cookies, visit the relevant
        provider’s website. Disabling cookies may prevent the use of some Platform features.
      </p>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">
        Terms and Rules for Withdrawal After Acceptance and Fee Refund
      </h2>
      <ol className="list-decimal space-y-3 pl-6">
        <li>
          If a student withdraws after uploading all required documents and receiving
          official acceptance from the university, a deduction determined by the university’s
          policies will be applied to the amount paid. The student accepts this deduction in
          advance.
        </li>
        <li>
          The deduction covers administrative, processing, and service costs incurred by the
          university and the Platform.
        </li>
        <li>
          The deduction rate is determined by the relevant university and UnivGates and is
          communicated to the student beforehand.
        </li>
        <li>
          In case of withdrawal after acceptance, refunds are made only within this framework
          and in line with the university’s policies. UnivGates acts solely as an intermediary
          and has no authority over deductions.
        </li>
        <li>
          Universities must evaluate applications and documents within a reasonable period and
          may not cause arbitrary delays or rejections when the student meets all conditions.
          Otherwise, disputes are resolved by the relevant official authorities.
        </li>
        <li>
          Partner companies integrated into the Platform must fully comply with UnivGates’
          system and rules. Contracts of non-compliant partners may be terminated. The
          Platform relies on the verification processes provided by the partner for official
          documents.
        </li>
      </ol>
    </section>
  </>
);

const TurkishTerms = () => (
  <>
    <header className="space-y-4 text-center">
      <h1 className="text-4xl font-bold">Kullanıcı Sözleşmesi</h1>
      <p className="text-muted-foreground">
        UnivGates platformunu kullanarak aşağıda yer alan koşulları okuduğunuzu ve kabul
        ettiğinizi beyan edersiniz.
      </p>
    </header>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">1. Taraflar</h2>
      <p>
        İşbu Kullanıcı Sözleşmesi, aşağıda tanımlanan Platforma üye olan veya Platformu
        herhangi bir şekilde kullanan kullanıcı ile Merkez Mah. Marmara Cad. Ozan Bağcılar İş
        Merkezi No:27-29 Kat 3/56 Avcılar/İstanbul adresinde bulunan Academia Group Eğitim
        Danışmanlık Ltd. Şti. (Aday Öğrenci, Üniversite, Partner Şirket ve “UnivGates” olarak
        anılır) arasında akdedilmiştir.
      </p>
      <p>
        Bu sözleşme univgates.com web sitesini, “Üniversite Tercihi” ve “Tercih Motoru” mobil
        uygulamalarını, lise ve üniversite sınavlarına yönelik tüm hizmetleri ve gerçek ya da
        tüzel kişilere sunulan tüm dijital kanalları kapsar. Web sitesine veya mobil
        uygulamaya giriş yapmanız ya da bu ortamlarda sunulan herhangi bir bilgiyi
        kullanmanız, aşağıdaki koşulları kabul ettiğiniz anlamına gelir.
      </p>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">2. Tanımlar</h2>
      <ul className="space-y-3 list-disc pl-6">
        <li>
          <strong>Platform:</strong> univgates.com web sitesi ile UnivGates mobil
          uygulamalarının tamamı.
        </li>
        <li>
          <strong>Kullanıcı veya Kullanıcılar:</strong> UnivGates tarafından kullanıma sunulan
          univgates.com web sitesine ve mobil uygulamasına üye olan ve/veya Platform dahilinde
          sunulan hizmetlerden işbu sözleşmede belirtilen koşullar dahilinde yararlanan,
          mentörlük hizmeti sunan ve/veya Platforma erişim sağlayan gerçek ve/veya tüzel
          kişiler.
        </li>
        <li>
          <strong>Üyelik Hesabı:</strong> Kullanıcının Platform içinde sunulan hizmetlerden
          yararlanmak için gerekli işlemleri gerçekleştirdiği, üyelikle veya sunulan
          hizmetlerle ilgili konularda UnivGates’e talepte bulunduğu, üyelik bilgilerini
          güncellediği ve sunulan hizmetlerle ilgili raporlamaları görüntüleyebildiği; Kullanıcı
          tarafından belirlenen kullanıcı adı ve şifre ile erişilen, “Üyeliği Tamamla”, “Google
          ile Üye Ol”, “Facebook ile Üye Ol” veya Platformun izin verdiği diğer sosyal medya ve
          kimlik doğrulama araçları üzerinden oluşturulan kullanıcıya özel hesap. Üniversite
          temsilcileri için üyelik, yalnızca resmi üniversite e-posta adresleri, irtibat
          bilgileri ve üniversiteye ait resmi banka hesapları üzerinden yapılabilir; kişisel
          bilgiler ve hesaplar kullanılamaz.
        </li>
        <li>
          <strong>Yöneticiler:</strong> UnivGates tarafından yetkilendirilmiş kişiler.
        </li>
        <li>
          <strong>Mentörlük Hizmeti:</strong> UnivGates tarafından platforma mentör olarak
          eklenen gerçek kişilerin kullanıcılarla yalnızca sistem üzerinden, kabul sonrası
          görüntülü veya yazılı olarak bire bir iletişim kurması.
        </li>
        <li>
          <strong>Veritabanı:</strong> Platform dahilinden erişilen içeriklerin depolandığı,
          tasnif edildiği, sorgulanabildiği ve erişilebildiği; 5846 sayılı Fikir ve Sanat
          Eserleri Kanunu gereğince korunan ve işlem tamamlandığında silinen UnivGates’e ait
          veri tabanı.
        </li>
      </ul>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">3. Sözleşmenin Konusu ve Kapsamı</h2>
      <p>
        Bu sözleşme, kullanıcıların bir araya geldiği Platformda sunulan hizmetlerin ve bu
        hizmetlerden yararlanma şartlarının belirlenmesi ile tarafların hak ve yükümlülüklerinin
        tespitini konu edinir. Kullanıcı, işbu sözleşme hükümlerini kabul etmekle Platform içinde
        yer alan kullanıma, üyeliğe ve tüm hizmetlere ilişkin UnivGates tarafından açıklanan her
        türlü beyanı da kabul etmiş sayılır.
      </p>
      <p>Kullanıcı, belirtilen beyanlarda yer alan tüm hususlara uygun davranacağını kabul, beyan ve taahhüt eder.</p>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">4. Üyelik ve Hizmet Kullanımı Şartları</h2>
      <div className="space-y-3">
        <p>
          <strong>4.a.</strong> Platforma üye olma işlemi, mobil uygulama veya web sitesi
          tarafından yönlendirilecek Kullanıcıya ait Facebook, Google veya UnivGates’in entegre
          ettiği diğer sosyal medya hesaplarından en az birine giriş yapılması ya da üyelik
          formunun eksiksiz doldurulması ile gerçekleşir. Üyelik, UnivGates’in başvuruyu e-posta
          veya telefon üzerinden onaylaması ile tamamlanır; onaylanmayan üyelikler sözleşmede
          tanımlanan hakları doğurmaz.
        </p>
        <p>
          <strong>4.b.</strong> Platforma üye olabilmek için en az 14 yaşında olmak, tüzel kişi
          kullanıcılar için temsil ve ilzam yetkisine sahip bulunmak ve UnivGates tarafından
          üyelikten uzaklaştırılmamış veya süresiz yasaklanmamış olmak gereklidir. Bu şartları
          sağlamayan başvurular ya da üyeliği askıya alınmış veya yasaklanmış kişiler tarafından
          yapılan talepler, kayıt işlemi tamamlanmış olsa dahi üyeliğin doğurduğu hakları doğurmaz.
        </p>
        <p>
          <strong>4.c.</strong> UnivGates, mentörleri kendi değerlendirme süreci sonrasında
          platforma dahil eder. Hizmet sunan kullanıcıların yetkinliği ve kullanıcılar tarafından
          sunulan hizmete ilişkin UnivGates’in herhangi bir sorumluluğu bulunmaz.
        </p>
        <p>
          <strong>4.d.</strong> UnivGates, herhangi bir gerekçe göstermeksizin ve bildirimde
          bulunmaksızın işbu sözleşmeyi tek taraflı olarak feshedebilir, kullanıcının üyeliğini
          sonlandırabilir veya geçici olarak durdurabilir. Bu işlemler için tazminat ödeme
          yükümlülüğü bulunmaz.
        </p>
        <p>
          <strong>4.e.</strong> Platforma erişim ücretsizdir; ancak platform içinde bazı ücretli
          hizmetler sunulabilir ve bu hizmetlerin kullanımı kullanıcı tercihine bırakılmıştır.
        </p>
        <p>
          <strong>4.f.</strong> UnivGates, kullanıcıların işlemlerini daha etkin şekilde
          gerçekleştirebilmesi amacıyla hizmetlerde dilediği zaman değişiklik ve uyarlama yapabilir.
          Yapılan değişiklik ve uyarlamalara ilişkin kurallar, ilgili hizmetin açıklamalarının
          bulunduğu web sitesi veya mobil uygulama üzerinden duyurulur.
        </p>
        <p>
          <strong>4.g.</strong> UnivGates ile kullanıcılar arasında eğitim, üniversite, kariyer ve
          sosyal yaşam gibi öğrenci odaklı konularda görüşme yapılabilir. Hakaret, karalama,
          ırkçılık, siyasi veya dini propaganda, cinsel içerikli görüşmeler, taciz ve yasadışı
          kullanım kesinlikle yasaktır ve bu tür eylemlerden UnivGates sorumlu değildir.
        </p>
        <p>
          <strong>4.ğ.</strong> Tüm kullanıcıların hizmet alma durumları ve bilgileri UnivGates
          tarafından kayıt altına alınabilir. UnivGates, bu kayıtlar kapsamında üçüncü taraf
          kişi, kurum ve ürünlerle fiziksel veya elektronik ortamda iletişim kurabilir.
        </p>
        <p>
          <strong>4.h.</strong> UnivGates, görüşmeler çerçevesindeki yorumları, doküman
          paylaşımlarını, anlık iletileri ve ekran görüntülerini yalnızca üniversitelerle
          paylaşabilir. Kullanıcıların e-posta, telefon, isim, soyisim, profil bilgileri ve
          platform kullanım hareketleri gibi bilgileri elektronik ve fiziksel ortamda analiz
          edilebilir, derlenebilir ve iş geliştirme ile yazılım geliştirme amaçlı kullanılabilir.
        </p>
        <p>
          <strong>4.ı.</strong> Platformda sunulan hizmetlerde yaşanabilecek sunucu gecikmeleri,
          üniversite kaynaklı gecikmeler, sunucu kapanmaları, veri kaybı ve siber saldırılar gibi
          durumlardan doğacak aksama ve zararlardan UnivGates sorumlu değildir.
        </p>
        <p>
          <strong>4.i.</strong> Kullanıcılar, sisteme girişte kullandıkları bilgileri yalnızca
          kendileri kullanmakla yükümlüdür. Bu yükümlülüğün ihlalinden kaynaklanan uyuşmazlıklardan
          UnivGates sorumlu tutulamaz; sorumluluk, bilgilerin sahibi olan kişiye veya sisteme giriş
          yapan kişiye aittir.
        </p>
        <p>
          <strong>4.j.</strong> UnivGates’in kullanıcıların e-posta, adı, soyadı, pasaport, kimlik,
          fotoğraf ve doküman gibi temel bilgilerinin gerçeğe uygunluğunu denetleme yükümlülüğü
          bulunmamaktadır.
        </p>
        <p>
          <strong>4.k.</strong> UnivGates, web ve mobil uygulamalardan toplanan bilgi ve istek
          formlarını üniversitelere ve üçüncü paydaşlara işleyişin sağlıklı olabilmesi adına iletme
          hakkına sahiptir.
        </p>
        <p>
          <strong>4.l.</strong> UnivGates, platformda ve e-posta gönderimlerinde UnivGates’e veya
          üçüncü kişilere ait reklam, tanıtım ve açıklamalar gösterebilir. UnivGates, yalnızca
          kendisine ait reklamların içeriğinden sorumludur.
        </p>
        <p>
          <strong>4.m.</strong> Kullanıcıların ziyaret ettiği bölümler, üniversiteler, tercih
          botunda yaptıkları aramalar ve benzeri kullanım verileri UnivGates tarafından analizlerde
          kullanılabilir; analizlerden elde edilen raporlar web sitesinde ve sosyal medya
          mecralarında yayınlanabilir.
        </p>
        <p>
          <strong>4.n.</strong> UnivGates, üniversite ücretleri üzerinde herhangi bir sorumluluk
          kabul etmez. Tercihlerde yanlışlık olmaması adına üniversitelerin web siteleri, YKS veya
          YÖK Atlas kılavuzları üzerinden bilgilerinizi yeniden kontrol etmeniz önerilir.
        </p>
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">5. Hak ve Yükümlülükler</h2>
      <div className="space-y-3">
        <h3 className="text-xl font-semibold">5.1. Kullanıcı Genel Hak ve Yükümlülükleri</h3>
        <p>
          <strong>5.1.a.</strong> Kullanıcı, üyelik prosedürlerini tamamlar ve Platform
          hizmetlerinden yararlanırken işbu sözleşmede yer alan tüm şartlara, Platformda ilgili
          hizmet için belirtilen kurallara ve yürürlükteki tüm mevzuata uygun hareket edeceğini
          kabul ve taahhüt eder.
        </p>
        <p>
          <strong>5.1.b.</strong> UnivGates’in yürürlükteki mevzuat uyarınca resmi makamlara bilgi
          verme yükümlülüğü doğduğu hallerde, resmi makamların talebi üzerine kullanıcıya ait
          gizli, özel veya ticari bilgiler resmi makamlara açıklanabilir ve bu nedenle
          UnivGates’ten herhangi bir tazminat talep edilemez.
        </p>
        <div>
          <p>
            <strong>5.1.c.</strong> Kullanıcılar, UnivGates hesabına girişte kullandıkları sosyal
            medya kullanıcı adı ve şifrelerinin güvenliğini sağlamakla yükümlüdür. Bu kapsamda
            kullanıcılar:
          </p>
          <ol className="list-decimal space-y-2 pl-6">
            <li>Güçlü ve güvenli bir şifre belirler.</li>
            <li>Şifrelerini gizli ve güvende tutar.</li>
            <li>Hesabının herhangi bir kısmını üçüncü kişilerle paylaşmaz.</li>
            <li>Yasalara ve işbu sözleşme hükümlerine uymayı kabul eder.</li>
          </ol>
        </div>
        <p>
          <strong>5.1.ç.</strong> Kullanıcılar tarafından sağlanan bilgi ve içeriklerin doğru ve
          hukuka uygun olduğu kabul edilir. UnivGates, kullanıcılar tarafından iletilen veya
          Platforma yüklenen bilgilerin doğruluğunu araştırmak ve güvenliğini garanti etmekle
          yükümlü değildir; bu içeriklerin hatalı veya hukuka aykırı olmasından doğacak
          zararlardan sorumlu tutulamaz.
        </p>
        <p>
          <strong>5.1.d.</strong> Kullanıcılar, UnivGates’in yazılı onayı olmaksızın işbu
          sözleşmeyi veya kapsamındaki hak ve yükümlülükleri üçüncü kişilere devredemez.
        </p>
        <p>
          <strong>5.1.e.</strong> Platformu kullanan herkes yalnızca hukuka uygun amaçlarla işlem
          yapabilir. Kullanıcılar, Platform üzerindeki her işlem ve eylemden doğan hukuki ve cezai
          sorumluluğun kendilerine ait olduğunu kabul eder. Kullanıcılar, UnivGates’in ve üçüncü
          kişilerin ayni veya şahsi haklarına, malvarlığına zarar verecek nitelikteki içerikleri
          çoğaltmayacağını, kopyalamayacağını, dağıtmayacağını, işlemeyeceğini veya Platforma
          yüklemeyeceğini taahhüt eder; bu yollarla UnivGates ile rekabete girmekten kaçınır.
        </p>
        <p>
          <strong>5.1.f.</strong> UnivGates veri tabanındaki bilgiler, UnivGates’in yazılı onayı
          olmadan kısmen veya tamamen kopyalanamaz, başka veri tabanlarına aktarılamaz ve üçüncü
          kişilerin erişimine açılamaz.
        </p>
        <p>
          <strong>5.1.g.</strong> Platformda sağlanan mentörlük hizmetlerinden doğan herhangi bir
          sorumluluk UnivGates’e, çalışanlarına veya yöneticilerine ait değildir. Üçüncü kişiler
          tarafından sağlanan bilgiler ve içeriklerin doğruluğu ve hukuka uygunluğu tamamen ilgili
          kişilerin sorumluluğundadır.
        </p>
        <p>
          <strong>5.1.ğ.</strong> UnivGates’in yazılı izni olmadan Platform üzerinden başka bir web
          sitesine veya uygulamaya link verilmesi ya da iletişim bilgilerinin paylaşılması yasaktır.
        </p>
        <p>
          <strong>5.1.h.</strong> Kullanıcıların üyelik sırasında verdikleri bilgiler, mentörlük
          hizmeti sağlandıktan sonra veya kullanıcıların birbirleriyle iletişim talepleri
          neticesinde diğer kullanıcılarla paylaşılabilir. Mentör mesajlaşma özelliğini kullanan
          kullanıcılar birbirleriyle mesajlaşarak iletişim kurabilir; UnivGates bu görüşmelere
          sonradan müdahale etmez ve sorumluluk kabul etmez.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">5.2. UnivGates’in Hak ve Yükümlülükleri</h3>
        <p>
          <strong>5.2.a.</strong> UnivGates, sözleşmede bahsi geçen hizmetleri sağlamak, gerekli
          teknolojik altyapıyı kurmak ve işletmekle yükümlüdür. Bu yükümlülük sınırsız hizmet
          taahhüdü anlamına gelmez; UnivGates hizmetleri ve teknolojik altyapıyı önceden bildirim
          yapmadan durdurabilir veya sonlandırabilir.
        </p>
        <p>
          <strong>5.2.b.</strong> Platform üzerinden UnivGates’in kontrolünde olmayan üçüncü
          kişilere ait internet sitelerine, dosyalara veya içeriklere link verilebilir. Bu linkler
          yalnızca referans kolaylığı sağlamak amacı taşır ve link verilen sitelerin içeriklerinden
          UnivGates sorumlu tutulamaz.
        </p>
        <p>
          <strong>5.2.c.</strong> UnivGates, platformda sunulan hizmetleri ve içerikleri dilediği
          zaman değiştirme, tüm kullanıcıların veya üçüncü kişilerin erişimine kapatma ve silme
          hakkını saklı tutar.
        </p>
        <p>
          <strong>5.2.ç.</strong> UnivGates, üyeliğe ilişkin kullanıcı bilgilerini kullanıcı
          güvenliği, kendi yükümlülüklerini yerine getirme ve istatistiki değerlendirme amacıyla
          kullanabilir, veri tabanında saklayabilir. Kullanıcı, işbu sözleşmeyi kabul etmekle bu
          kullanıma onay vermiş sayılır.
        </p>
        <p>
          <strong>5.2.d.</strong> UnivGates, Platform’un işleyişine, hukuka, sözleşme koşullarına,
          başkalarının haklarına ve genel ahlaka aykırı içerikleri ve mesajları kontrol edebilir,
          erişime kapatabilir ve ilgili kullanıcının üyeliğini bildirim yapmadan sonlandırabilir.
        </p>
        <p>
          <strong>5.2.e.</strong> Kullanıcılar, info@univgates.com adresinden UnivGates’e ulaşarak
          Platform kullanımı hakkında teknik destek, talep ve şikayet iletebilir; ayrıca işleyişe
          dair tanıtım videosundan yararlanabilir.
        </p>
        <p>
          <strong>5.2.f.</strong> UnivGates, Platform dahilinde kullanıcılar tarafından
          gerçekleştirilen iş ve işlemlerden dolayı hiçbir sorumluluk kabul etmez. Bu kapsamda
          UnivGates’in herhangi bir bedel veya idari para cezası ödemesi halinde, ihlali
          gerçekleştiren kullanıcı söz konusu bedeli derhal ve nakden karşılamakla yükümlüdür.
        </p>
        <p>
          <strong>5.2.g.</strong> UnivGates veya iş birliği yaptığı ödeme kuruluşu, güvenlik
          şüphesi bulunan işlemlerde kullanıcının kredi kartı, banka havalesi veya mail order
          bilgilerini geçici olarak askıya alabilir, işleme bloke koyabilir veya işlemi tamamen
          durdurabilir; bu nedenle UnivGates’in kullanıcıya veya üçüncü kişilere karşı sorumluluğu
          bulunmaz.
        </p>
        <p>
          <strong>5.2.ğ.</strong> UnivGates veya iş birliği yaptığı ödeme kuruluşları, reklam bedeli
          kapsamında online ödeme sistemine konu kartın limit yeterliliğini ödeme öncesinde
          sorgulama hakkına sahiptir.
        </p>
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">6. UnivGates Hizmetleri ve Kullanım Koşulları</h2>
      <div className="space-y-3">
        <h3 className="text-xl font-semibold">6.1. UnivGates Genel Hizmet Çerçevesi</h3>
        <p>
          UnivGates, kullanıcıların eğitim hizmetleri hakkında bilgi edinebildiği, öğrencilerin
          üniversiteler, diğer kullanıcılar ve mentörlerle belirtilen koşullar çerçevesinde iletişim
          kurabildiği bir platform sağlar ve bu kapsamda aracılık hizmeti sunar.
        </p>
        <p>
          UnivGates.com üyeleri, iletişim formu gönderdikleri takdirde bilgilerinin anlaşmalı
          üniversitelerle paylaşılacağını kabul eder ve bu kapsamda UnivGates ile üniversitelerden
          gelecek telefon ve e-posta bildirimlerini kabul etmiş sayılır.
        </p>
        <p>Üyeler yıl boyunca aşağıdaki imkânlardan yararlanabilir:</p>
        <ul className="space-y-2 list-disc pl-6">
          <li>Üniversite tanıtımlarına erişim.</li>
          <li>İnternet üzerinden düzenlenen görüntülü etkinliklere katılım.</li>
          <li>Staj duyurularından haberdar olma.</li>
          <li>Lisans, yüksek lisans ve çevrim içi eğitim programlarını araştırma.</li>
          <li>İlgi alanlarına göre blog yazılarını inceleme.</li>
          <li>Üniversiteleri çok yönlü olarak karşılaştırma.</li>
          <li>Üniversitelere danışma ve soru yöneltme.</li>
          <li>Üniversiteler hakkında bırakılan kullanıcı yorumlarını okuma.</li>
          <li>Tercih bölümünde üniversite tercih listeleri oluşturma.</li>
          <li>
            Scouting ile yetenek, ilgi ve başarı doğrultusunda burs başvurusunda bulunma.
          </li>
          <li>Üniversiteler, şehirler ve bölümler hakkında detaylı bilgi edinme.</li>
          <li>
            İlgi duyulan üniversiteler için bilgi formu doldurup bölüm seçerek kayıt
            gerçekleştirme.
          </li>
          <li>Üniversitelerden bilgi talebinde bulunma.</li>
        </ul>
        <p>
          Kullanıcılar, üyeliklerinin silinmesini açıkça talep etmedikleri sürece bu ayrıcalıklardan
          faydalanmaya devam eder.
        </p>
        <p>
          <strong>6.1.b.</strong> Kullanıcı, UnivGates hesabı üzerinden yaptığı tüm iş ve işlemlerin
          sorumluluğunun kendisine ait olduğunu, bu işlemleri kendisi gerçekleştirmediği yönünde
          itirazda bulunamayacağını kabul eder.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">
          6.2. UnivGates Hizmetlerinde Kullanıcıların Genel Hak ve Yükümlülükleri
        </h3>
        <p>
          <strong>6.2.a.</strong> Kullanıcılar, platformda duyurulan mentörlük hizmetini satın alma
          ve mentörlerle iletişime geçme taleplerini platform altyapısını kullanarak gerçekleştirir.
        </p>
        <p>
          <strong>6.2.b.</strong> UnivGates, platforma yeni hizmet içerikleri ekleyebilir ve ek
          hizmetler için ücret talep edebilir. Ödemeler sonrasında Kullanıcının platforma kayıtlı
          e-posta adresine elektronik fatura iletilir. Kullanıcı, vergi mevzuatı ve diğer yasal
          yükümlülükleri eksiksiz yerine getirmekle yükümlüdür. UnivGates, mentör ve hizmet alan
          kullanıcılar arasındaki iletişimin tarafı değildir; hukuka aykırı işlemlerden doğan
          sorumluluk ilgili kullanıcılara aittir. Kullanıcı, ödeme işlemlerinde kullanılan kredi
          kartı veya banka bilgilerinin UnivGates’in anlaşmalı olduğu üçüncü taraf ödeme sistemleri
          tarafından saklanmasına onay verir ve güvenlik önlemlerinin bu sistemlerce sağlandığını
          kabul eder.
        </p>
        <p>
          <strong>6.2.c.</strong> Kullanıcılar, platformda duyurulan ek hizmetlerden yararlanırken
          ilgili bölümde belirtilen yükümlülüklere uymayı kabul eder.
        </p>
        <p>
          <strong>6.2.ç.</strong> Mentörler tarafından sunulan hizmetlerin ayıplı olup olmadığı,
          açıklamaların doğruluğu ve tamlığı gibi hususlarda UnivGates herhangi bir taahhütte
          bulunmaz.
        </p>
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">7. Gizlilik Politikası</h2>
      <div className="space-y-3">
        <p>
          <strong>7.a.</strong> Platformda daha iyi hizmet sunmak amacıyla kullanıcı adı, yaş,
          e-posta adresi gibi kişisel bilgiler talep edilebilir. Bu veriler, UnivGates tarafından
          hizmetin yerine getirilmesi amacıyla kullanılır; ayrıca platform üzerinde yapılan
          işlemlere ait istatistiksel veriler analiz edilir ve saklanır.
        </p>
        <p>
          <strong>7.b.</strong> Üyelik formları ile iletilen iletişim bilgileri, kullanıcının talebi
          doğrultusunda ilgili üçüncü kişilerle paylaşılabilir.
        </p>
        <p>
          <strong>7.c.</strong> Scouting sayfası üzerinden yapılan başvurular neticesinde elde edilen
          bilgiler, ilgili paydaş kurum ve kuruluşlarla paylaşılabilir.
        </p>
        <p>
          <strong>7.ç.</strong> UnivGates, üyelik formları ile iletilen bilgileri, kullanıcı izni
          olmaksızın faaliyet dışı amaçlarla kullanmaz ve satmaz.
        </p>
        <p>
          <strong>7.d.</strong> Mobil uygulama veya web sitesi kullanımına ilişkin istatistiksel
          kayıtlar tutulur; IP adresi, internet servis sağlayıcısı, tarayıcı özellikleri, işletim
          sistemi ve siteye giriş-çıkış sayfaları gibi bilgiler yalnızca istatistiksel amaçla
          kullanılır ve kullanıcıların mahremiyetini ihlal etmeyecek şekilde anonim kalır.
        </p>
        <p>
          <strong>7.e.</strong> Platformda üçüncü kişilere ait reklam, tanıtım ve açıklamalar
          yayınlanabilir; bu yayınlar çerez içerebilir.
        </p>
        <p>
          <strong>7.f.</strong> Platformda farklı internet adreslerine bağlantılar verilebilir;
          UnivGates, link verilen sitelerin içeriklerinden veya gizlilik prensiplerinden sorumlu
          değildir.
        </p>
        <p>
          <strong>7.g.</strong> Çerezler, kullanıcı deneyimini geliştirmek amacıyla kullanılabilir.
          Tarayıcı ayarları üzerinden çerezleri yönetmek mümkündür.
        </p>
        <p>
          <strong>7.ğ.</strong> UnivGates, Countly, Google Analytics, Google Tag Manager ve Facebook
          gibi hizmet sağlayıcıların çerezlerinden faydalanabilir.
        </p>
        <p>
          <strong>7.h.</strong> Hizmetlerin sunulabilmesi için kişisel verilerin toplanması,
          saklanması, kullanılması, işlenmesi ve aktarılması gerekir. Platformu kullanmaya devam
          ederek bu işlemlere muvafakat etmiş sayılırsınız.
        </p>
        <p>
          İşbu Gizlilik Politikası kapsamında kişisel veriler, sözleşmeden doğan yükümlülükleri
          yerine getirmek, kayıt tutmak, şirket içi raporlama ve destek hizmetleri sağlamak,
          performans ölçümü yapmak, mentörlerle iletişimi kolaylaştırmak, yasal gerekliliklere uymak
          ve işimizi geliştirmek amacıyla kullanılabilir ve gerekli hallerde üçüncü kişilerle
          paylaşılabilir.
        </p>
        <p>
          <strong>7.ı.</strong> Kullanıcı, paylaştığı bilgilerin kendisine ait olduğunu ve bu
          bilgilerin UnivGates faaliyetlerinin yürütülmesi amacıyla kullanılmasına onay verdiğini
          kabul eder.
        </p>
        <p>
          <strong>7.i.</strong> Kişisel veriler, sözleşmede ve Aydınlatma Metninde belirtilen
          amaçlarla yurt içi ve yurt dışındaki hizmet sağlayıcılara aktarılabilir.
        </p>
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">8. Fikri Mülkiyet Hakları</h2>
      <p>
        UnivGates web sitesi ve mobil uygulamasının genel görünümü, dizaynı, markası, logoları,
        ikonları, teknik verileri, yazılımları, satış sistemi, iş yöntemi ve iş modeli dahil olmak
        üzere tüm materyaller UnivGates’in mülkiyetinde veya lisansı altındadır. Kullanıcı, bu
        materyalleri yalnızca sözleşme süresince ve sözleşme hükümlerine uygun olarak kullanacağını;
        kopyalamayacağını, çoğaltmayacağını, satmayacağını, devretmeyeceğini, umuma arz etmeyeceğini,
        tersine mühendislik uygulamayacağını ve sözleşme kapsamı dışında kullanmayacağını kabul eder.
        Bu yükümlülükler sözleşme sona erse dahi süresiz olarak devam eder.
      </p>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">9. Diğer Hükümler</h2>
      <div className="space-y-3">
        <p>
          <strong>9.1. Sözleşme Değişiklikleri:</strong> UnivGates, işbu sözleşmeyi dilediği zaman
          platformda ilan ederek değiştirme hakkını saklı tutar. Değiştirilen hükümler ilan
          tarihinde yürürlüğe girer, diğer hükümler aynen geçerlidir.
        </p>
        <p>
          <strong>9.2. Delil:</strong> Taraflar, uyuşmazlık halinde UnivGates’e ait defter ve
          kayıtların, bilgisayar kayıtlarının, veri tabanı ve sunucu kayıtlarının, ticari
          kayıtların, faks mesajlarının, anlık mesajlaşma ve sosyal medya yazışmalarının kesin ve
          bağlayıcı delil olduğunu kabul eder.
        </p>
        <p>
          <strong>9.3. Uygulanacak Hukuk ve Yetki:</strong> Sözleşmenin uygulanmasında Türk Hukuku
          geçerlidir; doğabilecek uyuşmazlıkların çözümünde İstanbul Mahkemeleri ve İcra Daireleri
          yetkilidir.
        </p>
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">
        Ticari İletişim ve Ticari Elektronik İleti Onayı
      </h2>
      <p>
        6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun ve ilgili yönetmelik kapsamında,
        UnivGates tarafından veya yetkilendirdiği aracı firmalar vasıtasıyla telefon, çağrı merkezi,
        faks, otomatik arama makineleri, akıllı ses kaydedici sistemler, elektronik posta ve kısa
        mesaj hizmeti gibi araçlar kullanılarak gönderilecek tanıtım, kampanya ve bilgilendirme
        mesajlarını kabul etmiş sayılırsınız. UnivGates tarafından gönderilen iletilerde yer alan
        yöntemle ücretsiz biçimde gönderim listesinden çıkabilirsiniz.
      </p>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Teslimat ve İade Şartları</h2>
      <p>
        Müşteri olarak satın aldığınız paketi hiçbir cezai şart olmaksızın 8 saat içinde iptal
        edebilirsiniz. Hizmet sağlayan uzmanlar da aynı süre içinde iptal hakkına sahiptir. Ödeme
        sistem dışından gerçekleşmişse UnivGates sorumluluk kabul etmez. Satın alınan hizmet
        üniversite tarafından onaylandıktan sonra iptal edilemez ve üniversite prosedürleri işletilir.
        Hatalı ücretlendirme durumunda info@univgates.com adresi üzerinden UnivGates ile iletişime
        geçebilirsiniz.
      </p>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Çerez Politikası</h2>
      <p>
        UnivGates, web sitesi ve mobil uygulamalarının işlevselliğini sağlamak, yayınlanan içerik ve
        reklamları kişiselleştirmek, trafiği analiz etmek ve kullanıcı deneyimini geliştirmek
        amacıyla çerezler kullanır. Sitede yer alan “Tüm çerezleri kabul et” seçeneğini
        onayladığınızda çerezlerin kullanılmasına izin vermiş olursunuz.
      </p>
      <p>
        Çerezler, ziyaret ettiğiniz internet siteleri tarafından tarayıcınıza yerleştirilen basit
        metin dosyalarıdır; kimlik veya iletişim bilgisi içermez. Oturum bilgilerini anonim olarak
        saklayarak kullanıcı alışkanlıklarınıza göre sizi tanımamıza yardımcı olur.
      </p>
      <p>
        UnivGates’te kullanılan çerez türleri arasında Google Analytics, Google Tag Manager,
        Facebook, Countly ve kullanıcı ülke bilgisine bağlı olarak fiyat ve para birimi
        güncellemeleri sağlayan çerezler bulunur. Çerezleri tarayıcı ayarlarınız üzerinden yönetebilir,
        reddedebilir, belirli siteler için izin verebilir veya silebilirsiniz. Üçüncü taraf
        çerezlerinden vazgeçmek için ilgili sağlayıcıların internet sitelerini ziyaret
        edebilirsiniz. Çerezleri reddetmeniz halinde platformun bazı özelliklerinden
        yararlanamayabilirsiniz.
      </p>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">
        Kabul Sonrası Vazgeçme ve Ücret İadesi Şartları
      </h2>
      <div className="space-y-3">
        <p>
          Aday Öğrenci, ilgili Üniversite veya Kurum ile Partner İşbirlikçi politikası kapsamında:
        </p>
        <ol className="list-decimal space-y-2 pl-6">
          <li>
            Öğrenci, gerekli tüm evrakları yükledikten ve üniversiteden resmi kabul aldıktan sonra
            başvurudan kendi isteğiyle vazgeçerse, üniversiteye ödenen ücret üzerinden ilgili
            üniversite politikaları doğrultusunda belirlenen bir kesinti yapılır.
          </li>
          <li>
            Kesinti, üniversite ve platform tarafından gerçekleştirilen idari, işlem ve hizmet
            giderlerini karşılamak amacıyla uygulanır.
          </li>
          <li>
            Kesinti oranı, ilgili üniversite ve UnivGates tarafından belirlenir ve öğrenciye
            önceden bildirilir.
          </li>
          <li>
            Öğrencinin kabul sonrası vazgeçmesi halinde ödemelerin iadesi yalnızca bu madde
            hükümleri çerçevesinde yapılır; platform aracıdır ve kesinti kararı üzerinde yetkisi
            yoktur.
          </li>
          <li>
            Üniversite, öğrencinin başvurusunu makul süre içinde değerlendirmekle yükümlüdür;
            öğrencinin tüm şartları yerine getirmesine rağmen keyfi gecikme veya ret yapılamaz.
            Aksi hâlde hukuki süreç resmi kurumlar nezdinde yürütülür.
          </li>
          <li>
            Platforma entegre olan partner firmalar, UnivGates sistem ve kurallarına tam uyum
            sağlamakla yükümlüdür; uymayan partnerlerin sözleşmeleri feshedilebilir.
          </li>
        </ol>
      </div>
    </section>
  </>
);

export default Terms;
