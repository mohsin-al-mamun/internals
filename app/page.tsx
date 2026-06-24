import Link from "next/link";
import styles from "./page.module.css";
import { REL_TOPICS } from "./relational/data";
import { NREL_TOPICS } from "./nonrelational/data";
import { LINUX_TOPICS } from "./linux/data";
import { DOCKER_TOPICS } from "./docker/data";
import ContinueLink from "./components/ContinueLink";
import HeroDiagram from "./components/HeroDiagram";

export default function Home() {
  return (
    <div className={styles.homePage}>
      <div className={styles.homeContainer}>
        <div className={styles.homeTopLabel}>Internals</div>

        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroLeft}>
            <h1 className={styles.heroHeadline}>
              Surface knowledge
              <br />
              <span className={styles.accentRead}>fades.</span>
              <br />
              <span className={styles.accentWrite}>Internals</span> stick.
            </h1>
            <div className={styles.heroStatus}>
              <span className={styles.statusItem}>
                <span className={`${styles.statusDot} ${styles.dotGreen}`} />
                understand why
              </span>
              <span className={styles.statusSep}>/</span>
              <span className={styles.statusItem}>
                <span className={`${styles.statusDot} ${styles.dotBlue}`} />
                not just how
              </span>
            </div>
          </div>

          {/* Diagram Panel */}
          <div className={styles.heroRight}>
            <HeroDiagram />
          </div>
        </section>

        {/* Stat row */}
        <div className={styles.statRow}>
          <span className={styles.statItem}>
            <span className={styles.statNum}>{REL_TOPICS.length + NREL_TOPICS.length + LINUX_TOPICS.length + DOCKER_TOPICS.length}</span> lessons
          </span>
          <span className={styles.statSep}>·</span>
          <span className={styles.statItem}>
            <span className={styles.statNum}>3</span> playgrounds
          </span>
          <span className={styles.statSep}>·</span>
          <span className={styles.statItem}>databases · linux · docker</span>
          <span className={styles.statSep}>·</span>
          <span className={styles.statItem}>Surface → Bedrock</span>
        </div>

        {/* Divider */}
        <div className={styles.heroDivider}>
          <div className={styles.dividerLine} />
          <span className={styles.dividerLabel}>Two Answers&nbsp;&middot;&nbsp;Two Tracks</span>
          <div className={styles.dividerLine} />
        </div>

        {/* Track Cards */}
        <section className={styles.cardsGrid}>
          <Link href="/relational" className={`${styles.trackCard} ${styles.trackRel}`}>
            <div className={styles.cardAccentLine} />
            <div className={styles.cardTagRow}>
              <span className={`${styles.tagDot} ${styles.tagDotBlue}`} />
              <span className={`${styles.tagText} ${styles.tagTextBlue}`}>Relational</span>
            </div>
            <h2 className={styles.cardTitle}>PostgreSQL</h2>
            <div className={styles.cardMeta}>tables &middot; keys &middot; joins &middot; transactions</div>
            <p className={styles.cardDesc}>Fixed schema, explicit relationships, strong consistency.</p>
            <div className={styles.cardLessonCount}>{REL_TOPICS.length} lessons &middot; 3 tiers &middot; SQL playground</div>
            <span className={`${styles.cardCta} ${styles.ctaBlue}`}>
              start with surface <span>→</span>
            </span>
            <ContinueLink track="relational" accentColor="#5b9bf9" />
          </Link>

          <Link href="/nonrelational" className={`${styles.trackCard} ${styles.trackNrel}`}>
            <div className={styles.cardAccentLine} />
            <div className={styles.cardTagRow}>
              <span className={`${styles.tagDot} ${styles.tagDotGreen}`} />
              <span className={`${styles.tagText} ${styles.tagTextGreen}`}>Non-Relational</span>
            </div>
            <h2 className={styles.cardTitle}>MongoDB &amp; Redis</h2>
            <div className={styles.cardMeta}>documents &middot; key-value &middot; flexible shape</div>
            <p className={styles.cardDesc}>Flexible shape, fast access, built for speed and scale.</p>
            <div className={styles.cardLessonCount}>{NREL_TOPICS.length} lessons &middot; 3 tiers &middot; KV + doc simulators</div>
            <span className={`${styles.cardCta} ${styles.ctaGreen}`}>
              start with surface <span>→</span>
            </span>
            <ContinueLink track="nonrelational" accentColor="#38d39b" />
          </Link>

          <Link href="/linux" className={`${styles.trackCard} ${styles.trackLinux}`}>
            <div className={styles.cardAccentLine} />
            <div className={styles.cardTagRow}>
              <span className={`${styles.tagDot} ${styles.tagDotAmber}`} />
              <span className={`${styles.tagText} ${styles.tagTextAmber}`}>Linux</span>
            </div>
            <h2 className={styles.cardTitle}>Commands</h2>
            <div className={styles.cardMeta}>shell &middot; filesystem &middot; processes &middot; scripting</div>
            <p className={styles.cardDesc}>The terminal from first principles — how the OS actually works.</p>
            <div className={styles.cardLessonCount}>{LINUX_TOPICS.length} lessons &middot; 3 tiers &middot; Docker sandbox</div>
            <span className={`${styles.cardCta} ${styles.ctaAmber}`}>
              start with surface <span>→</span>
            </span>
            <ContinueLink track="linux" accentColor="#f59e42" />
          </Link>

          <Link href="/docker" className={`${styles.trackCard} ${styles.trackDocker}`}>
            <div className={styles.cardAccentLine} />
            <div className={styles.cardTagRow}>
              <span className={`${styles.tagDot} ${styles.tagDotCyan}`} />
              <span className={`${styles.tagText} ${styles.tagTextCyan}`}>Docker</span>
            </div>
            <h2 className={styles.cardTitle}>Containers</h2>
            <div className={styles.cardMeta}>images &middot; volumes &middot; compose &middot; networking</div>
            <p className={styles.cardDesc}>From docker run to what namespaces and cgroups actually do.</p>
            <div className={styles.cardLessonCount}>{DOCKER_TOPICS.length} lessons &middot; 3 tiers</div>
            <span className={`${styles.cardCta} ${styles.ctaCyan}`}>
              start with surface <span>→</span>
            </span>
            <ContinueLink track="docker" accentColor="#0db7ed" />
          </Link>
        </section>
      </div>
    </div>
  );
}
