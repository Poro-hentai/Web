document.addEventListener("DOMContentLoaded", () => {

    // Function to fetch anime data from your local JSON file
    const fetchAnime = async () => {
        try {
            const res = await fetch("anime-data.json");
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return await res.json();
        } catch (error) {
            console.error("Failed to fetch anime data:", error);
            return []; // Return empty array on error
        }
    };

    // Function to render anime cards with flip effect
    const renderCards = (data, containerElement) => {
        if (!containerElement) {
            console.error("Container element not found for rendering cards.");
            return;
        }
        containerElement.innerHTML = ""; // Clear previous content

        if (!data || data.length === 0) {
            // Display a message if no anime data is found or data is empty
            const noAnimeMessage = document.createElement("p");
            noAnimeMessage.textContent = "No anime found matching your criteria.";
            noAnimeMessage.style.textAlign = "center"; // Center the message
            noAnimeMessage.style.gridColumn = "1 / -1"; // Make it span all columns in a grid
            noAnimeMessage.style.width = "100%"; // Ensure it takes full width in the grid context
            containerElement.appendChild(noAnimeMessage);
            return;
        }

        data.forEach(anime => {
            // Main card container (for perspective)
            const card = document.createElement("div");
            card.className = "anime-card animate__animated animate__fadeInUp"; // Add animation class
            card.style.setProperty('--animate-duration', '0.5s'); // Optional: control animation speed

            // Inner container that flips
            const cardInner = document.createElement("div");
            cardInner.className = "anime-card-inner";

            // Front face of the card
            const cardFront = document.createElement("div");
            cardFront.className = "anime-card-front";
            cardFront.innerHTML = `
                <img src="${anime.image || 'images/placeholder.jpg'}" alt="${anime.name || 'Anime Title'}" onerror="this.onerror=null;this.src='images/placeholder.jpg';">
                <h3>${anime.name || 'Anime Title'}</h3>
                <p class="front-description">${anime.description ? anime.description.substring(0, 80) + '...' : 'No description available.'}</p> <p class="hover-indicator">Hover for details</p>
            `;

            // Back face of the card
            const cardBack = document.createElement("div");
            cardBack.className = "anime-card-back";

            let downloadButtonHTML = '';
            // Only show a functional download button if a download link exists
            if (anime.download && anime.download !== '#') {
                downloadButtonHTML = `<a href="${anime.download}" class="glow-button" target="_blank" rel="noopener noreferrer">Download</a>`;
            } else {
                // Show a placeholder button if no download link
                downloadButtonHTML = `<a href="#" class="glow-button disabled" onclick="return false;">Download (Link N/A)</a>`;
            }

            cardBack.innerHTML = `
                <h3>${anime.name || 'Anime Title'}</h3>
                <p>${anime.description || 'No description available.'}</p>
                ${downloadButtonHTML}
            `;

            cardInner.appendChild(cardFront);
            cardInner.appendChild(cardBack);
            card.appendChild(cardInner);
            containerElement.appendChild(card);
        });
    };

    // Function to set up local search functionality
    const setupLocalSearch = async (inputId, searchResultContainerId, mainGridContainerId = null, category = null) => {
        const inputElement = document.getElementById(inputId);
        const resultsContainer = document.getElementById(searchResultContainerId);
        const mainGridElement = mainGridContainerId ? document.getElementById(mainGridContainerId) : null;

        if (!inputElement || !resultsContainer) {
            console.warn(`Search input or results container not found for: ${inputId}, ${searchResultContainerId}`);
            return; // Silently return if elements are not on the page
        }

        const allAnimeData = await fetchAnime();
        // Filter the full data by category for the main grid on this page
        const mainGridData = category ? allAnimeData.filter(anime => anime.category === category) : allAnimeData;


        // Function to display initial content (local data for the main grid)
        const displayMainGridContent = () => {
            // Initially, the search results container is empty
            resultsContainer.innerHTML = '';
            // The main grid is always visible
            if (mainGridElement) {
                renderCards(mainGridData, mainGridElement); // Render initial/categorized local data
            }
        };

        // Display initial content on page load
        displayMainGridContent();


        inputElement.addEventListener("input", () => {
            const searchTerm = inputElement.value.toLowerCase().trim();
            let filteredAnime = mainGridData; // Start with data relevant to this page's main grid

            if (searchTerm) {
                // Filter based on search term
                filteredAnime = filteredAnime.filter(anime =>
                    (anime.name || '').toLowerCase().includes(searchTerm) ||
                    (anime.description || '').toLowerCase().includes(searchTerm)
                );
                // Render search results in the dedicated container
                renderCards(filteredAnime, resultsContainer);

                // The main grid remains visible below the search results
            } else {
                // If search term is empty, clear search results
                resultsContainer.innerHTML = '';
                // The main grid is already visible
            }
        });

        // Also handle clearing results when the search input is cleared (e.g., by pressing X)
        inputElement.addEventListener("search", () => {
            if (inputElement.value === "") {
                resultsContainer.innerHTML = ''; // Clear search results
                // The main grid is already visible
            }
        });
    };


    // --- Page Initialization ---

    const currentPage = window.location.pathname.split("/").pop(); // Get current page filename

    if (currentPage === "index.html" || currentPage === "") {
        // Home Page: Setup local search and load trending anime
        setupLocalSearch("searchInput", "searchResults", "trendingAnime"); // Use trendingAnime as main grid
    } else if (currentPage === "ongoing.html") {
        // Ongoing Page: Setup local search and load ongoing anime
        setupLocalSearch("searchInputOngoing", "searchResultsOngoing", "animeGrid", "ongoing"); // Use animeGrid as main grid, filter by 'ongoing'
    } else if (currentPage === "anime.html") {
        // Anime Page: Setup local search and load all anime (or category="anime")
        setupLocalSearch("searchInputAnime", "searchResultsAnime", "animeGridAnime", "anime"); // Use animeGridAnime as main grid, filter by 'anime'
    } else if (currentPage === "about.html") {
        // About Page: Setup feedback form
        const contactForm = document.getElementById("contactForm");
        if (contactForm) {
            const formMessage = document.getElementById("formMessage");
            const successAnimation = document.getElementById("success-animation");

            contactForm.addEventListener("submit", function(event) {
                event.preventDefault();
                if (!formMessage || !successAnimation) {
                    console.error("Form message or success animation element not found.");
                    return;
                }

                // IMPORTANT: Replace 'YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', and 'YOUR_USER_ID' with your actual EmailJS credentials
                emailjs.sendForm('service_v9001qu', 'template_d66w1h7', this, 'M9Dzs6ZXnABSforwB')
                    .then(() => {
                        formMessage.innerText = ""; // Clear any previous messages
                        successAnimation.style.display = "flex"; // Show success animation
                        contactForm.reset(); // Reset the form
                        setTimeout(() => {
                            successAnimation.style.display = "none"; // Hide success animation after 3 seconds
                        }, 3000);
                    }, (error) => {
                        formMessage.innerText = "Failed to send message. Please try again."; // Show error message
                        console.error("EmailJS error:", error);
                        successAnimation.style.display = "none"; // Hide success animation on error
                    });
            });
            // EmailJS initialization is done in the about.html script tag before this script runs.
            // Ensure you have replaced 'YOUR_USER_ID' in about.html script tag.
        }

        // Initialize particles for the full background on the About page
        const fullPageParticlesContainer = document.getElementById("particles-js");
        if (fullPageParticlesContainer && typeof particlesJS !== 'undefined') {
            particlesJS("particles-js", {
                particles: {
                    number: {
                        value: 80,
                        density: {
                            enable: true,
                            value_area: 1000
                        }
                    },
                    color: {
                        value: "#9f6bff"
                    },
                    shape: {
                        type: "circle"
                    },
                    opacity: {
                        value: 0.5,
                        random: true
                    },
                    size: {
                        value: 3,
                        random: true
                    },
                    line_linked: {
                        enable: true,
                        distance: 150,
                        color: "#9f6bff",
                        opacity: 0.4,
                        width: 1
                    },
                    move: {
                        enable: true,
                        speed: 2,
                        direction: "none",
                        random: true,
                        straight: false,
                        out_mode: "out",
                        bounce: false
                    }
                },
                interactivity: {
                    detect_on: "canvas",
                    events: {
                        onhover: {
                            enable: true,
                            mode: "grab"
                        },
                        onclick: {
                            enable: false,
                            mode: "push"
                        },
                        resize: true
                    },
                    modes: {
                        grab: {
                            distance: 120,
                            line_linked: {
                                opacity: 0.8
                            }
                        },
                        bubble: {
                            distance: 250,
                            size: 25,
                            duration: 2,
                            opacity: 0.9
                        },
                        repulse: {
                            distance: 200,
                            duration: 0.4
                        },
                        push: {
                            particles_nb: 4
                        },
                        remove: {
                            particles_nb: 2
                        }
                    }
                },
                retina_detect: true
            });
        } else if (fullPageParticlesContainer && typeof particlesJS === 'undefined') {
            console.warn("particles.js library is not loaded for the full page background.");
        }

    }

    // Particle.js config (Footer) - Initialize particles only for the footer container on other pages
    const footerParticlesContainer = document.getElementById("particles-js-footer");
    // Check if it's NOT the about page and the container exists
    if (currentPage !== "about.html" && footerParticlesContainer && typeof particlesJS !== 'undefined') {
        particlesJS("particles-js-footer", { // Initialize particles for the footer container
            particles: {
                number: {
                    value: 80,
                    density: {
                        enable: true,
                        value_area: 1000
                    }
                },
                color: {
                    value: "#9f6bff"
                },
                shape: {
                    type: "circle"
                },
                opacity: {
                    value: 0.5,
                    random: true
                },
                size: {
                    value: 3,
                    random: true
                },
                line_linked: {
                    enable: true,
                    distance: 150,
                    color: "#9f6bff",
                    opacity: 0.4,
                    width: 1
                },
                move: {
                    enable: true,
                    speed: 2,
                    direction: "none",
                    random: true,
                    straight: false,
                    out_mode: "out",
                    bounce: false
                }
            },
            interactivity: {
                detect_on: "canvas",
                events: {
                    onhover: {
                        enable: true,
                        mode: "grab"
                    },
                    onclick: {
                        enable: false,
                        mode: "push"
                    },
                    resize: true
                },
                modes: {
                    grab: {
                        distance: 120,
                        line_linked: {
                            opacity: 0.8
                        }
                    },
                    bubble: {
                        distance: 250,
                        size: 25,
                        duration: 2,
                        opacity: 0.9
                    },
                    repulse: {
                        distance: 200,
                        duration: 0.4
                    },
                    push: {
                        particles_nb: 4
                    },
                    remove: {
                        particles_nb: 2
                    }
                }
            },
            retina_detect: true
        });
    }


    // Custom Cursor Tracker - Remove the JS logic for the cursor
    // The cursor element is still in HTML/CSS, but the movement tracking is removed.
    // If you want the cursor element completely gone, remove the <div class="cursor"></div> from HTML and the .cursor rule from CSS.
    // const customCursor = document.querySelector('.cursor');
    // if (customCursor) {
    //     document.addEventListener('mousemove', (e) => {
    //         customCursor.style.left = e.pageX + 'px';
    //         customCursor.style.top = e.pageY + 'px';
    //     });
    // }


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
    scrollToTopBtn.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth" // Smooth scrolling animation
        });
    });

    // --- Mobile Menu Toggle Functionality ---
    const mobileMenuIcon = document.querySelector('.mobile-menu-icon');
    const mobileMenu = document.querySelector('.mobile-menu');

    if (mobileMenuIcon && mobileMenu) {
        mobileMenuIcon.addEventListener('click', () => {
            mobileMenu.classList.toggle('is-open');
        });
    } else {
        console.warn("Mobile menu icon or container not found.");
    }
});