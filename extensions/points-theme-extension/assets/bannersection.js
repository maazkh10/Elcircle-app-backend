document.addEventListener("DOMContentLoaded", () => {
  initLookbookSlider();
});

// Shopify Theme Editor support for live previews
if (Shopify && Shopify.designMode) {
  document.addEventListener("shopify:section:load", initLookbookSlider);
}

function initLookbookSlider() {
  const containers = document.querySelectorAll(".noir-editorial-shell");

  containers.forEach((container) => {
    const slides = container.querySelectorAll(".noir-slide");
    const backgrounds = container.querySelectorAll(".noir-bg-image");
    const nextBtn = container.querySelector(".next-btn");
    const prevBtn = container.querySelector(".prev-btn");
    const progress = container.querySelector(".noir-progress-fill");

    if (!slides.length) return;

    let current = 0;
    let animating = false;

    gsap.set(slides, { autoAlpha: 0 });
    gsap.set(slides[0], { autoAlpha: 1 });

    gsap.set(backgrounds, { autoAlpha: 0 });
    if (backgrounds[0]) gsap.set(backgrounds[0], { autoAlpha: 1 });

    function updateProgress() {
      if (!progress) return;
      let width = ((current + 1) / slides.length) * 100;
      gsap.to(progress, { width: width + "%", duration: 0.35, ease: "power2.out" });
    }

    updateProgress();

    function goTo(index) {
      if (animating || index === current) return;
      animating = true;

      const currentSlide = slides[current];
      const nextSlide = slides[index];
      const currentBg = backgrounds[current];
      const nextBg = backgrounds[index];

      const tl = gsap.timeline({
        onComplete: () => {
          current = index;
          animating = false;
          updateProgress();
        }
      });

      tl.to(currentSlide, { autoAlpha: 0, duration: 0.3, ease: "power2.inOut" }, 0);
      if (currentBg) tl.to(currentBg, { autoAlpha: 0, duration: 0.4, ease: "power2.inOut" }, 0);

      tl.to(nextSlide, { autoAlpha: 1, duration: 0.4, ease: "power2.out" }, 0.15);
      if (nextBg) tl.to(nextBg, { autoAlpha: 1, duration: 0.5, ease: "power2.out" }, 0.05);
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        let next = current + 1 >= slides.length ? 0 : current + 1;
        goTo(next);
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        let prev = current - 1 < 0 ? slides.length - 1 : current - 1;
        goTo(prev);
      });
    }
  });
}
