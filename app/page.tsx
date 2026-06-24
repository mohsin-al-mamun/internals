import Link from "next/link";
import styles from "./page.module.css";
import { REL_TOPICS } from "./relational/data";
import { NREL_TOPICS } from "./nonrelational/data";
import ContinueLink from "./components/ContinueLink";

export default function Home() {
  return (
    <div className={styles.homePage}>
      <div className={styles.homeContainer}>
        <div className={styles.homeTopLabel}>Interactive Learning Platform</div>

        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroLeft}>
            <h1 className={styles.heroHeadline}>
              Every backend is the
              <br />
              same loop:
              <br />
              <span className={styles.accentRead}>read</span>
              <span className={styles.comma}>,</span>{" "}
              <span className={styles.accentWrite}>write</span>
              <span className={styles.comma}>,</span> repeat.
            </h1>
            <div className={styles.heroStatus}>
              <span className={styles.statusItem}>
                <span className={`${styles.statusDot} ${styles.dotGreen}`} />
                fetch state
              </span>
              <span className={styles.statusSep}>/</span>
              <span className={styles.statusItem}>
                <span className={`${styles.statusDot} ${styles.dotBlue}`} />
                persist state
              </span>
            </div>
          </div>

          {/* Diagram Panel */}
          <div className={styles.heroRight}>
            <div className={styles.diagramPanel}>
              <div className={styles.diagramLabel}>Request Lifecycle</div>
              <div className={styles.diagramContent}>
                {/* Client window */}
                <div className={styles.diagramNode}>
                  <div className={styles.clientWindow}>
                    <div className={styles.clientTitlebar}>
                      <span className={styles.clientDot} />
                      <span className={styles.clientDot} />
                      <span className={styles.clientDot} />
                    </div>
                    <div className={styles.clientBody}>
                      <div className={styles.clientRow}>
                        <span className={`${styles.rowIcon} ${styles.iconGreen}`} />
                        <span className={styles.rowBar} style={{ width: 74 }} />
                      </div>
                      <div className={styles.clientRow}>
                        <span className={`${styles.rowIcon} ${styles.iconBlue}`} />
                        <span className={styles.rowBar} style={{ width: 88 }} />
                      </div>
                      <div className={styles.clientRow}>
                        <span className={`${styles.rowIcon} ${styles.iconGreen}`} />
                        <span className={styles.rowBar} style={{ width: 60 }} />
                      </div>
                      <div className={styles.clientRow}>
                        <span className={`${styles.rowIcon} ${styles.iconGray}`} />
                        <span className={styles.rowBar} style={{ width: 80 }} />
                      </div>
                    </div>
                  </div>
                  <span className={styles.nodeLabel}>CLIENT</span>
                </div>

                {/* Lanes */}
                <div className={styles.diagramLanes}>
                  <div className={`${styles.lane} ${styles.laneWrite}`}>
                    <div className={styles.laneHeader}>
                      <span className={styles.laneLabel}>WRITE</span>
                    </div>
                    <div className={styles.laneFlow}>
                      <div className={styles.laneBlocks}>
                        <span className={`${styles.block} ${styles.blockBlue}`} />
                        <span className={`${styles.block} ${styles.blockBlueDim55}`} />
                        <span className={`${styles.block} ${styles.blockBlueDim28}`} />
                      </div>
                      <div className={`${styles.laneLine} ${styles.lineBlue}`} />
                      <span className={`${styles.laneArrow} ${styles.arrowBlue}`}>→</span>
                    </div>
                  </div>
                  <div className={`${styles.lane} ${styles.laneRead}`}>
                    <div className={`${styles.laneHeader} ${styles.laneHeaderRight}`}>
                      <span className={styles.laneLabel}>READ</span>
                    </div>
                    <div className={styles.laneFlow}>
                      <span className={`${styles.laneArrow} ${styles.arrowGreen}`}>←</span>
                      <div className={`${styles.laneLine} ${styles.lineGreen}`} />
                      <div className={styles.laneBlocks}>
                        <span className={`${styles.block} ${styles.blockGreenDim28}`} />
                        <span className={`${styles.block} ${styles.blockGreenDim55}`} />
                        <span className={`${styles.block} ${styles.blockGreen}`} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* DB Cylinder */}
                <div className={styles.diagramNode}>
                  <svg
                    className={styles.dbCylinder}
                    viewBox="0 0 118 138"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7 18 V120 C7 128 30 134 59 134 C88 134 111 128 111 120 V18"
                      fill="#0f1013"
                      stroke="rgba(255,255,255,0.13)"
                      strokeWidth="1.4"
                    />
                    <ellipse
                      cx="59"
                      cy="18"
                      rx="52"
                      ry="14"
                      fill="#16181b"
                      stroke="rgba(255,255,255,0.15)"
                      strokeWidth="1.4"
                    />
                    <rect x="26" y="40" width="22" height="5" rx="2.5" fill="#5b9bf9" />
                    <rect x="54" y="40" width="34" height="5" rx="2.5" fill="rgba(91,155,249,0.45)" />
                    <rect x="26" y="58" width="34" height="5" rx="2.5" fill="rgba(255,255,255,0.18)" />
                    <rect x="66" y="58" width="22" height="5" rx="2.5" fill="#38d39b" />
                    <rect x="26" y="76" width="26" height="5" rx="2.5" fill="rgba(56,211,155,0.45)" />
                    <rect x="58" y="76" width="30" height="5" rx="2.5" fill="rgba(255,255,255,0.18)" />
                    <rect x="26" y="94" width="30" height="5" rx="2.5" fill="rgba(91,155,249,0.45)" />
                    <rect x="62" y="94" width="26" height="5" rx="2.5" fill="rgba(255,255,255,0.18)" />
                  </svg>
                  <span className={styles.nodeLabel}>DATABASE</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stat row */}
        <div className={styles.statRow}>
          <span className={styles.statItem}>
            <span className={styles.statNum}>{REL_TOPICS.length + NREL_TOPICS.length}</span> lessons
          </span>
          <span className={styles.statSep}>·</span>
          <span className={styles.statItem}>
            <span className={styles.statNum}>3</span> playgrounds
          </span>
          <span className={styles.statSep}>·</span>
          <span className={styles.statItem}>PostgreSQL · MongoDB · Redis</span>
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
        </section>
      </div>
    </div>
  );
}
