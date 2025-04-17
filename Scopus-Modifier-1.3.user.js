// ==UserScript==
// @name         Scopus-Modifier
// @version      1.3
// @icon64       https://cdn.elsevier.io/verona/includes/favicons/favicon-96x96.png
// @description  Modifies Scopus URLs to remove specific parameters and add functionality
// @author       Leif Assistant
// @match        https://www.scopus.com/authid/detail.uri?*
// @match        https://www2.scopus.com/authid/detail.uri?*
// @downloadURL  https://raw.githubusercontent.com/liqi0601/ScopusModifier/main/Scopus-Modifier-1.3.user.js
// ==/UserScript==

(function () {
    'use strict';

    // List of parameters to remove
    const paramsToRemove = ['&origin=peoplefinder', '&origin=resultsAnalyzer&zone=authorName', '&origin=recordpage', '&origin=recordPage'];
    let currentURL = window.location.href;
    let newURL = currentURL;

    // Fix www2 → www
    if (currentURL.startsWith('https://www2.scopus.com/authid/detail.uri?authorId=')) {
        newURL = newURL.replace('www2.scopus.com', 'www.scopus.com');
    }

    // Redirect if origin=resultslist
    if (currentURL.includes('origin=resultslist') && currentURL.includes('authorId=')) {
        const urlParams = new URLSearchParams(currentURL.split('?')[1]);
        const authorId = urlParams.get('authorId');
        if (authorId) {
            newURL = `https://www.scopus.com/authid/detail.uri?authorId=${authorId}`;
            window.location.href = newURL;
            return;
        }
    }

    // Clean URL parameters
    if (newURL.startsWith('https://www.scopus.com/authid/detail.uri?')) {
        paramsToRemove.forEach(param => {
            if (newURL.includes(param)) {
                newURL = newURL.replace(param, '');
            }
        });
        if (newURL !== currentURL) {
            window.location.href = newURL;
        }
    }

    function createButtonAndContainers() {
        // ====== Email Container ======
        const emailContainer = document.createElement('div');
        emailContainer.style.position = 'fixed';
        emailContainer.style.top = '40px';
        emailContainer.style.left = '50%';
        emailContainer.style.transform = 'translateX(-50%)';
        emailContainer.style.zIndex = '10000';
        emailContainer.style.padding = '10px 20px';
        emailContainer.style.fontSize = '15px';
        emailContainer.style.backgroundColor = '#ffffff';
        emailContainer.style.color = '#333';
        emailContainer.style.border = '1px solid #ccc';
        emailContainer.style.borderRadius = '8px';
        emailContainer.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
        emailContainer.style.cursor = 'pointer';

        const emailText = document.createElement('span');
        const copyHint = document.createElement('div');
        copyHint.textContent = 'Click to copy';
        copyHint.style.display = 'none';
        copyHint.style.position = 'absolute';
        copyHint.style.top = '-18px';
        copyHint.style.left = '50%';
        copyHint.style.transform = 'translateX(-50%)';
        copyHint.style.fontSize = '12px';
        copyHint.style.color = '#555';
        copyHint.style.background = '#f9f9f9';
        copyHint.style.padding = '2px 6px';
        copyHint.style.border = '1px solid #ddd';
        copyHint.style.borderRadius = '5px';
        copyHint.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)';

        emailContainer.onmouseover = function () {
            copyHint.style.display = 'block';
        };
        emailContainer.onmouseout = function () {
            copyHint.style.display = 'none';
        };
        emailContainer.onclick = function () {
            const email = emailText.textContent;
            if (email !== 'null' && email !== 'Error fetching email') {
                navigator.clipboard.writeText(email).then(() => {
                    copyHint.textContent = 'Copied!';
                    setTimeout(() => {
                        copyHint.textContent = 'Click to copy';
                    }, 2000);
                });
            } else {
                copyHint.textContent = 'No valid email to copy';
                setTimeout(() => {
                    copyHint.textContent = 'Click to copy';
                }, 2000);
            }
        };

        emailContainer.appendChild(emailText);
        emailContainer.appendChild(copyHint);

        // ====== Shared Button Style ======
        function createStyledButton(label, leftPercent) {
            const button = document.createElement('button');
            button.textContent = label;
            button.style.position = 'fixed';
            button.style.top = '100px';
            button.style.left = `${leftPercent}%`;
            button.style.transform = 'translateX(-50%)';
            button.style.zIndex = '10000';
            button.style.padding = '10px 22px';
            button.style.fontSize = '15px';
            button.style.fontWeight = '600';
            button.style.background = 'linear-gradient(to right, #4CAF50, #45A049)';
            button.style.color = 'white';
            button.style.border = 'none';
            button.style.borderRadius = '8px';
            button.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            button.style.cursor = 'pointer';
            button.style.transition = 'background 0.3s, transform 0.2s';

            button.onmouseover = () => {
                button.style.background = 'linear-gradient(to right, #45A049, #4CAF50)';
                button.style.transform = 'translateX(-50%) scale(1.05)';
            };
            button.onmouseout = () => {
                button.style.background = 'linear-gradient(to right, #4CAF50, #45A049)';
                button.style.transform = 'translateX(-50%) scale(1)';
            };

            return button;
        }

        const scholarButton = createStyledButton('Scholar', 45);
        const searchButton = createStyledButton('Search', 55);

        scholarButton.onclick = function () {
            const apiUrl = currentURL.replace('https://www.scopus.com/authid/detail.uri?authorId=', 'https://www.scopus.com/api/authors/');
            fetch(apiUrl)
                .then(res => res.json())
                .then(data => {
                    const fullName = data.preferredName.full;
                    const [last, first] = fullName.split(', ');
                    const scholarUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(first + ' ' + last)}`;
                    window.open(scholarUrl, '_blank');
                });
        };

        searchButton.onclick = function () {
            const apiUrl = currentURL.replace('https://www.scopus.com/authid/detail.uri?authorId=', 'https://www.scopus.com/api/authors/');
            fetch(apiUrl)
                .then(res => res.json())
                .then(data => {
                    const fullName = data.preferredName.full;
                    const institution = data.latestAffiliatedInstitution?.name || '';
                    const [last, first] = fullName.split(', ');
                    const query = `${first} ${last}, ${institution}`;
                    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                    window.open(searchUrl, '_blank');
                });
        };

        document.body.appendChild(emailContainer);
        document.body.appendChild(scholarButton);
        document.body.appendChild(searchButton);

        // Fetch email
        const apiUrl = currentURL.replace('https://www.scopus.com/authid/detail.uri?authorId=', 'https://www.scopus.com/api/authors/');
        fetch(apiUrl)
            .then(res => res.json())
            .then(data => {
                emailText.textContent = data.emailAddress || 'null';
            })
            .catch(err => {
                emailText.textContent = 'Error fetching email';
                console.error(err);
            });
    }

    window.addEventListener('load', createButtonAndContainers);
})();
