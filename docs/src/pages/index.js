import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link className="button button--secondary button--lg" to="/docs/getting-started">
            Get Started →
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="Developer documentation for the Namma Transit commuter survey bot and admin dashboard">
      <HomepageHeader />
      <main className="container margin-vert--lg">
        <div className="row">
          <div className="col col--4">
            <Heading as="h3">Backend</Heading>
            <p>
              Express + Prisma + Postgres. Handles the WhatsApp webhook, the bilingual
              survey state machine, and the admin API.
            </p>
            <Link to="/docs/backend/overview">Read the backend docs →</Link>
          </div>
          <div className="col col--4">
            <Heading as="h3">Database</Heading>
            <p>
              Every Prisma model — survey data, conversation state, and Better Auth's
              admin tables — with fields and relations explained.
            </p>
            <Link to="/docs/database/schema">Read the schema docs →</Link>
          </div>
          <div className="col col--4">
            <Heading as="h3">Frontend</Heading>
            <p>
              React + Vite + shadcn/ui admin dashboard for viewing survey responses,
              with the full component and auth architecture.
            </p>
            <Link to="/docs/frontend/overview">Read the frontend docs →</Link>
          </div>
        </div>
      </main>
    </Layout>
  );
}
