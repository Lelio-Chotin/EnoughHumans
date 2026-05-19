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
            const item = items[currentIndex];

            if (!item) return;

            const itemLeft = item.offsetLeft;
            let target = -itemLeft;

            if (target < maxTranslate) {
                target = maxTranslate;
            }

            if (target > 0) {
                target = 0;
            }

            currentTranslate = target;
            prevTranslate = target;

            carousel.style.transition = "transform 0.35s cubic-bezier(0.215, 0.61, 0.355, 1)";

            carousel.style.transform = `translate3d(${target}px,0,0)`;
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

            carousel.style.transform = `translate3d(${currentTranslate}px,0,0)`;
        }

        function dragEnd() {
            if (!isDragging) return;
            isDragging = false;
            carousel.classList.remove("dragging");

            setTimeout(() => {
                dragDistance = 0;
            }, 50);

            const parentRect =carousel.parentElement.getBoundingClientRect();

            let closestIndex = 0;
            let closestDistance = Infinity;

            items.forEach((item, index) => {
                const itemRect = item.getBoundingClientRect();
                const distance = Math.abs(itemRect.left - parentRect.left);

                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestIndex = index;
                }
            });

            currentIndex = closestIndex;

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