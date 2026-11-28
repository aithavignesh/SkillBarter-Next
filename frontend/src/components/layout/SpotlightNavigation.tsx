import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, Compass, HelpCircle, Sparkles } from 'lucide-react';

const sections = [
  { id: 'how-it-works', label: 'How it works', icon: BookOpen },
  { id: 'explore', label: 'Explore', icon: Compass },
  { id: 'why-skillbarter', label: 'Why SkillBarter', icon: Sparkles },
  { id: 'faq', label: 'FAQ', icon: HelpCircle },
];

function getSectionAtReadingLine() {
  const readingLine = window.innerHeight * 0.32;
  return sections.findIndex(({ id }) => {
    const element = document.getElementById(id);
    if (!element) return false;
    const bounds = element.getBoundingClientRect();
    return bounds.top <= readingLine && bounds.bottom > readingLine;
  });
}

export const SpotlightNavigation: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const programmaticTarget = useRef<string | null>(null);
  const targetTimer = useRef<number | null>(null);
  const animationFrame = useRef<number | null>(null);
  const updateActiveRef = useRef<() => void>(() => undefined);
  const spotlightIndex = hoverIndex ?? activeIndex;

  useEffect(() => {
    const updateActive = () => {
      const targetId = programmaticTarget.current;
      if (targetId) {
        const target = document.getElementById(targetId);
        const readingLine = window.innerHeight * 0.32;
        const bounds = target?.getBoundingClientRect();
        if (bounds && bounds.top <= readingLine && bounds.bottom > readingLine) {
          programmaticTarget.current = null;
          if (targetTimer.current !== null) window.clearTimeout(targetTimer.current);
          targetTimer.current = null;
        } else {
          const targetIndex = sections.findIndex((section) => section.id === targetId);
          setActiveIndex(targetIndex < 0 ? null : targetIndex);
          return;
        }
      }

      const index = getSectionAtReadingLine();
      setActiveIndex(index < 0 ? null : index);
    };

    updateActiveRef.current = updateActive;
    let observer: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(updateActive, {
        rootMargin: '-25% 0px -65% 0px',
        threshold: 0,
      });
      sections.forEach(({ id }) => {
        const element = document.getElementById(id);
        if (element) observer?.observe(element);
      });
    }

    const onScroll = () => {
      if (animationFrame.current !== null) return;
      animationFrame.current = window.requestAnimationFrame(() => {
        animationFrame.current = null;
        updateActive();
      });
    };
    const onUserScroll = () => {
      if (!programmaticTarget.current) return;
      programmaticTarget.current = null;
      if (targetTimer.current !== null) window.clearTimeout(targetTimer.current);
      targetTimer.current = null;
      updateActive();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateActive);
    window.addEventListener('wheel', onUserScroll, { passive: true });
    window.addEventListener('touchstart', onUserScroll, { passive: true });
    updateActive();

    return () => {
      observer?.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', updateActive);
      window.removeEventListener('wheel', onUserScroll);
      window.removeEventListener('touchstart', onUserScroll);
      if (animationFrame.current !== null) window.cancelAnimationFrame(animationFrame.current);
      if (targetTimer.current !== null) window.clearTimeout(targetTimer.current);
    };
  }, []);

  const navigateToSection = (event: React.MouseEvent<HTMLAnchorElement>, index: number) => {
    event.preventDefault();
    const { id } = sections[index]!;
    const target = document.getElementById(id);
    if (!target) return;

    if (targetTimer.current !== null) window.clearTimeout(targetTimer.current);
    programmaticTarget.current = id;
    setActiveIndex(index);
    target.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
    targetTimer.current = window.setTimeout(() => {
      programmaticTarget.current = null;
      targetTimer.current = null;
      updateActiveRef.current();
    }, 1800);
  };

  const renderLinks = (mobile = false) => sections.map(({ id, label, icon: Icon }, index) => {
    const highlighted = spotlightIndex === index;
    const dimmed = spotlightIndex !== null && !highlighted;
    return (
      <a
        key={id}
        href={`#${id}`}
        aria-label={label}
        aria-current={activeIndex === index ? 'location' : undefined}
        onClick={(event) => navigateToSection(event, index)}
        onFocus={() => setHoverIndex(index)}
        onBlur={(event) => {
          if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node)) {
            setHoverIndex(null);
          }
        }}
        onPointerEnter={(event) => {
          if (event.pointerType !== 'touch') setHoverIndex(index);
        }}
        onPointerLeave={(event) => {
          if (event.pointerType !== 'touch') setHoverIndex(null);
        }}
        className={`spotlight-nav__item${highlighted ? ' spotlight-nav__item--active' : ''}${dimmed ? ' spotlight-nav__item--dimmed' : ''}${mobile ? ' spotlight-nav__item--mobile' : ''}`}
      >
        <Icon aria-hidden="true" className="spotlight-nav__icon" />
        <span className="spotlight-nav__label">{label}</span>
      </a>
    );
  });

  return (
    <>
      <aside className="spotlight-rail" aria-label="Homepage sections">
        <nav className="spotlight-nav spotlight-nav--vertical" aria-label="Homepage section navigation">
          <p className="spotlight-nav__eyebrow">On this page</p>
          <div className="spotlight-nav__list">
            <span className="spotlight-nav__thread" aria-hidden="true">
              <span
                className="spotlight-nav__thread-glow"
                style={{
                  top: spotlightIndex === null ? '50%' : `${(spotlightIndex / (sections.length - 1)) * 100}%`,
                  opacity: spotlightIndex === null ? 0 : 1,
                }}
              />
              {spotlightIndex !== null && <span className="spotlight-nav__thread-dot" style={{ top: `${spotlightIndex * 84}px` }} />}
            </span>
            {renderLinks()}
          </div>
        </nav>
      </aside>

      <nav className="spotlight-mobile" aria-label="Homepage section navigation">
        <div className="spotlight-mobile__list">
          <span className="spotlight-mobile__thread" aria-hidden="true" />
          {spotlightIndex !== null && (
            <span
              className="spotlight-mobile__thread-dot"
              aria-hidden="true"
              style={{ left: `${12.5 + spotlightIndex * 25}%` }}
            />
          )}
          {renderLinks(true)}
        </div>
      </nav>
    </>
  );
};
