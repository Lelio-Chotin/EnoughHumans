document.addEventListener("DOMContentLoaded", () => {
    const carousels = document.querySelectorAll(".carousel");

    if (carousels.length === 0) return;

    carousels.forEach((carousel) => {
        const items = carousel.querySelectorAll(".simulation");

        let currentTranslate = 0;
        let prevTranslate = 0;
        let startX = 0;
        let isDragging = false;
        let currentIndex = 0;
        let maxTranslate = 0;
        let dragDistance = 0;

        function updateLayout() {
            if (items.length === 0) return;
            const totalContentWidth = carousel.scrollWidth;
            const parent = carousel.parentElement;
            const parentStyle = window.getComputedStyle(parent);
            const paddingH = parseFloat(parentStyle.paddingLeft) + parseFloat(parentStyle.paddingRight);
            const visibleWidth = parent.clientWidth - paddingH;

            maxTranslate = -(totalContentWidth - visibleWidth);
            if (maxTranslate > 0) maxTranslate = 0;

            snapToIndex();
        }

        function snapToIndex() {
            if (items.length === 0) return;
            const itemWidth = items[0].getBoundingClientRect().width;
            const gap = parseInt(window.getComputedStyle(carousel).gap) || 0;
            let target = -(currentIndex * (itemWidth + gap));

            if (target > 0) {
                target = 0;
                currentIndex = 0;
            } else if (target < maxTranslate) {
                target = maxTranslate;
                currentIndex = Math.round(Math.abs(maxTranslate) / (itemWidth + gap));
            }

            currentTranslate = target;
            prevTranslate = currentTranslate;
            carousel.style.transition = "transform 0.5s cubic-bezier(0.215, 0.61, 0.355, 1)";
            carousel.style.transform = `translateX(${currentTranslate}px)`;
        }

        function dragMove(x) {
            if (!isDragging) return;
            const delta = x - startX;
            dragDistance = Math.abs(delta);
            currentTranslate = prevTranslate + delta;

            if (currentTranslate > 0) {
                currentTranslate = delta * 0.2;
            } else if (currentTranslate < maxTranslate) {
                currentTranslate = maxTranslate + (currentTranslate - maxTranslate) * 0.2;
            }

            carousel.style.transform = `translateX(${currentTranslate}px)`;
        }

        function dragEnd() {
            if (!isDragging) return;
            isDragging = false;
            carousel.classList.remove("dragging");

            setTimeout(() => { dragDistance = 0; }, 50);

            const itemWidth = items[0].getBoundingClientRect().width;
            const gap = parseInt(window.getComputedStyle(carousel).gap) || 0;
            const step = itemWidth + gap;

            currentIndex = Math.round(Math.abs(currentTranslate) / step);
            snapToIndex();
        }

        carousel.addEventListener("mousedown", e => {
            isDragging = true;
            startX = e.pageX;
            dragDistance = 0;
            carousel.classList.add("dragging");
            carousel.style.transition = "none";
        });

        carousel.addEventListener("dragstart", e => e.preventDefault());

        carousel.addEventListener("click", e => {
            if (dragDistance > 5) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, true);

        window.addEventListener("mousemove", e => dragMove(e.pageX));
        window.addEventListener("mouseup", dragEnd);

        carousel.addEventListener("touchstart", e => {
            isDragging = true;
            startX = e.touches[0].clientX;
            dragDistance = 0;
            carousel.style.transition = "none";
        }, { passive: true });

        carousel.addEventListener("touchmove", e => dragMove(e.touches[0].clientX), { passive: true });
        carousel.addEventListener("touchend", dragEnd);

        window.addEventListener("resize", updateLayout);
        updateLayout();
    });

    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
    }, 100);
});