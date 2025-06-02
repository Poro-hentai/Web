document.addEventListener("DOMContentLoaded", () => {

    const Kitsu_API_BASE_URL = "https://kitsu.io/api/edge";
    const animeGridIndex = document.getElementById("animeGridIndex"); // For home page featured anime
    const animeGridOngoing = document.getElementById("animeGrid"); // For ongoing.html
    const animeGridAnime = document.getElementById("animeGridAnime"); // For anime.html

    // Search result containers and inputs
    const searchResultsSectionIndex = document.getElementById("searchResultsSection"); // Removed, results directly below search
    const searchResultsIndex = document.getElementById("searchResults");
    const searchInputIndex = document.getElementById("searchInput"); // Nav search on index (desktop)
    const searchInputMobileIndex = document.getElementById("searchInputMobile"); // Mobile nav search on index

    const searchResultsSectionAnime = document.getElementById("searchResultsSectionAnime"); // Removed, results directly below search
    const searchResultsAnime = document.getElementById("searchResultsAnime");
    const searchInputAnime = document.getElementById("searchInputAnime"); // Nav search on anime page (desktop)
    const searchInputAnimeMobile = document.getElementById("searchInputAnimeMobile"); // Mobile nav search on anime page

    const searchResultsSectionOngoing = document.getElementById("searchResultsSectionOngoing"); // Removed, results directly below search
    const searchResultsOngoing = document.getElementById("searchResultsOngoing");
    const searchInputOngoing = document.getElementById("searchInputOngoing"); // Nav search on ongoing page (desktop)
    const searchInputOngoingMobile = document.getElementById("searchInputOngoingMobile"); // Mobile nav search on ongoing page

    // Anime Detail Overlay elements
    const animeDetailOverlay = document.getElementById('animeDetailOverlay');
    const closeDetailBtn = document.querySelector('.close-detail-btn');
    const detailPoster = document.getElementById('detailPoster');
    const detailTitle = document.getElementById('detailTitle');
    const detailGenre = document.getElementById('detailGenre');
    const detailCategory = document.getElementById('detailCategory');
    const detailDescription = document.getElementById('detailDescription');
    const detailDownloadBtn = document.getElementById('detailDownloadBtn');

    let allAnimeData = []; // To store combined data from anime-data.json and Kitsu
    let timeoutId; // For debouncing search input

    // Function to fetch anime data from local JSON and enrich with Kitsu API
    const fetchAndEnrichAnime = async () => {
        try {
            const localRes = await fetch("anime-data.json");
            if (!localRes.ok) {
                throw new Error(`HTTP error! status: ${localRes.status}`);
            }
            const localAnime = await localRes.json();

            const kitsuPromises = localAnime.map(async (anime) => {
                // Search Kitsu by title to get detailed information
                const kitsuSearchRes = await fetch(`${Kitsu_API_BASE_URL}/anime?filter[text]=${encodeURIComponent(anime.title)}`);
                if (kitsuSearchRes.ok) {
                    const kitsuData = await kitsuSearchRes.json();
                    if (kitsuData.data && kitsuData.data.length > 0) {
                        const kitsuAnime = kitsuData.data[0].attributes;
                        return {
                            id: kitsuData.data[0].id, // Add Kitsu ID for potential future use
                            title: anime.title,
                            posterImage: kitsuAnime.posterImage ? (kitsuAnime.posterImage.large || kitsuAnime.posterImage.medium) : 'placeholder.jpg',
                            description: kitsuAnime.synopsis || "No description available.",
                            download: anime.download,
                            category: anime.category || "General", // Default to "General" if not specified
                            genre: anime.genre || "N/A"
                        };
                    }
                }
                // If Kitsu data not found or error, return local data with placeholders
                return {
                    id: null,
                    title: anime.title,
                    posterImage: 'placeholder.jpg', // A generic placeholder image
                    description: "No description available.",
                    download: anime.download,
                    category: anime.category || "General",
                    genre: anime.genre || "N/A"
                };
            });

            allAnimeData = await Promise.all(kitsuPromises);
            console.log("Combined Anime Data:", allAnimeData);
            return allAnimeData;

        } catch (error) {
            console.error("Failed to fetch and enrich anime data:", error);
            return []; // Return empty array on error
        }
    };

    // Function to render anime cards
    const renderCards = (data, containerElement, isSearch = false) => {
        if (!containerElement) {
            console.error("Container element not found for rendering cards.");
            return;
        }
        containerElement.innerHTML = ""; // Clear previous content

        if (!data || data.length === 0) {
            const noAnimeMessage = document.createElement("p");
            noAnimeMessage.textContent = isSearch ? "No matching anime found." : "No anime found.";
            noAnimeMessage.style.textAlign = "center";
            noAnimeMessage.style.gridColumn = "1 / -1";
            noAnimeMessage.style.width = "100%";
            containerElement.appendChild(noAnimeMessage);
            return;
        }

        data.forEach((anime) => {
            const animeCard = document.createElement("div");
            animeCard.classList.add("anime-card");
            if (isSearch) {
                animeCard.classList.add("search-result-card"); // Add class for specific search result styling
            }

            animeCard.innerHTML = `
                <div class="anime-card-inner">
                    <div class="anime-card-front">
                        <img src="${anime.posterImage}" alt="${anime.title} Poster">
                        <h3>${anime.title}</h3>
                        <p>${anime.genre}</p>
                    </div>
                </div>
            `;
            // Add click listener to show detail overlay
            animeCard.addEventListener('click', () => displayAnimeDetail(anime));
            containerElement.appendChild(animeCard);
        });
    };

    // Function to display anime details in the overlay
    const displayAnimeDetail = (anime) => {
        detailPoster.src = anime.posterImage;
        detailTitle.textContent = anime.title;
        detailGenre.textContent = anime.genre;
        detailCategory.textContent = anime.category;
        detailDescription.textContent = anime.description;
        detailDownloadBtn.href = anime.download;
        animeDetailOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling body when overlay is active
    };

    // Close anime detail overlay
    if (closeDetailBtn) {
        closeDetailBtn.addEventListener('click', () => {
            animeDetailOverlay.classList.remove('active');
            document.body.style.overflow = ''; // Restore body scrolling
        });
    }

    // Close overlay when clicking outside the content
    if (animeDetailOverlay) {
        animeDetailOverlay.addEventListener('click', (event) => {
            if (event.target === animeDetailOverlay) {
                animeDetailOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // Function to handle search input
    const handleSearch = (searchInput, searchResultsContainer, allAnime) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            const query = searchInput.value.toLowerCase();
            const filteredAnime = allAnime.filter(anime =>
                anime.title.toLowerCase().includes(query) ||
                anime.genre.toLowerCase().includes(query)
            );
            if (query.length > 0) {
                searchResultsContainer.style.display = 'grid'; // Ensure grid display for search results
                renderCards(filteredAnime, searchResultsContainer, true); // Pass true for isSearch
            } else {
                searchResultsContainer.innerHTML = '';
                searchResultsContainer.style.display = 'none'; // Hide if no query
            }
        }, 300); // Debounce time
    };

    // Initialize Page Content
    const initializePage = async () => {
        allAnimeData = await fetchAndEnrichAnime();

        // **NEW: Add 'search-results-grid' class to search result containers**
        if (searchResultsIndex) {
            searchResultsIndex.classList.add("search-results-grid");
        }
        if (searchResultsAnime) {
            searchResultsAnime.classList.add("search-results-grid");
        }
        if (searchResultsOngoing) {
            searchResultsOngoing.classList.add("search-results-grid");
        }

        // Home Page (index.html)
        if (animeGridIndex) {
            const popularAnime = allAnimeData.filter(anime => anime.category === "Popular");
            renderCards(popularAnime, animeGridIndex);
            if (searchInputIndex) {
                searchInputIndex.addEventListener('input', () => handleSearch(searchInputIndex, searchResultsIndex, allAnimeData));
            }
            if (searchInputMobileIndex) {
                searchInputMobileIndex.addEventListener('input', () => handleSearch(searchInputMobileIndex, searchResultsIndex, allAnimeData));
            }
        }

        // Ongoing Page (ongoing.html)
        if (animeGridOngoing) {
            const ongoingAnime = allAnimeData.filter(anime => anime.category === "Ongoing");
            renderCards(ongoingAnime, animeGridOngoing);
            if (searchInputOngoing) {
                searchInputOngoing.addEventListener('input', () => handleSearch(searchInputOngoing, searchResultsOngoing, allAnimeData));
            }
            if (searchInputOngoingMobile) {
                searchInputOngoingMobile.addEventListener('input', () => handleSearch(searchInputOngoingMobile, searchResultsOngoing, allAnimeData));
            }
        }

        // Anime Page (anime.html)
        if (animeGridAnime) {
            renderCards(allAnimeData, animeGridAnime); // Render all anime
            if (searchInputAnime) {
                searchInputAnime.addEventListener('input', () => handleSearch(searchInputAnime, searchResultsAnime, allAnimeData));
            }
            if (searchInputAnimeMobile) {
                searchInputAnimeMobile.addEventListener('input', () => handleSearch(searchInputAnimeMobile, searchResultsAnime, allAnimeData));
            }
        }

        // Particles.js initialization for main and footer
        if (typeof particlesJS !== 'undefined') {
            particlesJS('particles-js', {
                "particles": {
                    "number": { "value": 80, "density": { "enable": true, "value_area": 800 } },
                    "color": { "value": "#00ffff" },
                    "shape": { "type": "circle", "stroke": { "width": 0, "color": "#000000" }, "polygon": { "nb_sides": 5 }, "image": { "src": "img/github.svg", "width": 100, "height": 100 } },
                    "opacity": { "value": 0.5, "random": false, "anim": { "enable": false, "speed": 1, "opacity_min": 0.1, "sync": false } },
                    "size": { "value": 3, "random": true, "anim": { "enable": false, "speed": 40, "size_min": 0.1, "sync": false } },
                    "line_linked": { "enable": true, "distance": 150, "color": "#00ffff", "opacity": 0.4, "width": 1 },
                    "move": { "enable": true, "speed": 6, "direction": "none", "random": false, "straight": false, "out_mode": "out", "bounce": false, "attract": { "enable": false, "rotateX": 600, "rotateY": 1200 } }
                },
                "interactivity": {
                    "detect_on": "canvas", "events": { "onhover": { "enable": true, "mode": "grab" }, "onclick": { "enable": true, "mode": "push" }, "resize": true },
                    "modes": { "grab": { "distance": 140, "line_linked": { "opacity": 1 } }, "bubble": { "distance": 400, "size": 40, "duration": 2, "opacity": 8, "speed": 3 }, "repulse": { "distance": 200, "duration": 0.4 },
                    "push": { "particles_nb": 2 }, "remove": { "particles_nb": 1 }
                    }
                },
                "retina_detect": true
            });

            particlesJS('particles-js-footer', {
                "particles": {
                    "number": { "value": 50, "density": { "enable": true, "value_area": 800 } },
                    "color": { "value": "#00ffff" },
                    "shape": { "type": "circle", "stroke": { "width": 0, "color": "#000000" }, "polygon": { "nb_sides": 5 }, "image": { "src": "img/github.svg", "width": 100, "height": 100 } },
                    "opacity": { "value": 0.5, "random": false, "anim": { "enable": false, "speed": 1, "opacity_min": 0.1, "sync": false } },
                    "size": { "value": 3, "random": true, "anim": { "enable": false, "speed": 40, "size_min": 0.1, "sync": false } },
                    "line_linked": { "enable": true, "distance": 150, "color": "#00ffff", "opacity": 0.4, "width": 1 },
                    "move": { "enable": true, "speed": 6, "direction": "none", "random": false, "straight": false, "out_mode": "out", "bounce": false, "attract": { "enable": false, "rotateX": 600, "rotateY": 1200 } }
                },
                "interactivity": {
                    "detect_on": "canvas", "events": { "onhover": { "enable": true, "mode": "grab" }, "onclick": { "enable": true, "mode": "push" }, "resize": true },
                    "modes": { "grab": { "distance": 140, "line_linked": { "opacity": 1 } }, "bubble": { "distance": 400, "size": 40, "duration": 2, "opacity": 8, "speed": 3 }, "repulse": { "distance": 200, "duration": 0.4 },
                    "push": { "particles_nb": 2 },
                    "remove": { "particles_nb": 1 }
                    }
                },
                "retina_detect": true
            });
        }
    };


    // Scroll to Top Button functionality
    const scrollToTopBtn = document.getElementById("scrollToTopBtn");

    // Show/hide the button based on scroll position
    window.addEventListener("scroll", () => {
        if (window.scrollY > 300) { // Show button after scrolling 300px
            scrollToTopBtn.classList.add("show");
        } else {
            scrollToTopBtn.classList.remove("show");
        }
    });

    // Scroll to top when the button is clicked
    if (scrollToTopBtn) {
        scrollToTopBtn.addEventListener("click", () => {
            window.scrollTo({
                top: 0,
                behavior: "smooth" // Smooth scrolling animation
            });
        });
    }


    // --- Mobile Menu Toggle Functionality ---
    const mobileMenuIcon = document.querySelector('.mobile-menu-icon');
    const mobileMenu = document.querySelector('.mobile-menu');

    if (mobileMenuIcon && mobileMenu) {
        mobileMenuIcon.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
        });

        // Close mobile menu when a link is clicked
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
            });
        });
    }

    initializePage(); // Call the main initialization function
});

// EmailJS setup for contact form (if applicable)
(function() {
    // Only initialize EmailJS if the form exists on the current page
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        emailjs.init("M9Dzs6ZXnABSforwB"); // Replace with your actual EmailJS User ID

        contactForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const formStatus = document.getElementById('form-status');
            formStatus.style.display = 'block';
            formStatus.style.color = '#00ffff';
            formStatus.textContent = 'Sending message...';

            emailjs.sendForm('service_v9001qu', 'template_d66w1h7', this) // Replace with your Service ID and Template ID
                .then(function() {
                    formStatus.textContent = 'Message sent successfully!';
                    formStatus.style.color = 'lightgreen';
                    contactForm.reset();
                }, function(error) {
                    formStatus.textContent = 'Failed to send message. Please try again.';
                    formStatus.style.color = 'red';
                    console.error('FAILED...', error);
                });
        });
    }
})();