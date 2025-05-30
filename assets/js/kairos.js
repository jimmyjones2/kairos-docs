import * as params from '@params';

function calculateBaseImage(distroInfo) {
    let baseImage = distroInfo[1] + ':' + distroInfo[2];

    // Special case for OpenSUSE since they use a slash to separate the family and flavor
    // e.g. opensuse/leap:15.6 and opensuse/tumbleweed (notice that this last one has no tag but it uses the latest tag by default)
    if (distroInfo[1] == 'opensuse') {
        baseImage = distroInfo[1] + '/' + distroInfo[2].replace('-', ':');
    } 

    return baseImage;
}

function encodeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

function decodeHTML(str) {
    const temp = document.createElement('div');
    temp.innerHTML = str;
    return temp.textContent;
}

function capitalizeFirstLetter(str) {
    if (!str) return str; // Handle empty strings
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function replaceVariables(content, distroInfo) {
    const familyRegex = new RegExp(/@family/, 'gi');
    const flavorRegex = new RegExp(/@flavor/, 'gi');
    const flavorReleaseRegex = new RegExp(/@flavorRelease/, 'gi');
    const baseImageRegex = new RegExp(/@baseImage/, 'gi');

    return content.replace(familyRegex, distroInfo[0])
                  .replace(flavorReleaseRegex, distroInfo[2])
                  .replace(flavorRegex, distroInfo[1])
                  .replace(baseImageRegex, calculateBaseImage(distroInfo));
}

// This could be simply replace all instances of quay.io/kairos for kairos.docker.scarf.sh, however for every image, there needs to be a package on scarf.sh added
// therefore it is better to replace the images individually to avoid changing an image that hasn't been created on the scarf.sh registry yet.
function replaceRepositories(content, state) {
    if (state === 'on') {
        return content.replace(/quay.io\/kairos\/auroraboot/g, 'kairos.docker.scarf.sh/kairos/auroraboot')
                      .replace(/quay.io\/kairos\/community-bundles/g, 'kairos.docker.scarf.sh/community-bundles')
                      .replace(/quay.io\/kairos\/framework/g, 'kairos.docker.scarf.sh/framework')
                      .replace(/quay.io\/kairos\/packages/g, 'kairos.docker.scarf.sh/packages');
    } else {
        return content.replace(/kairos.docker.scarf.sh\/kairos\/auroraboot/g, 'quay.io/kairos/auroraboot')
                      .replace(/kairos.docker.scarf.sh\/community-bundles/g, 'quay.io/kairos/community-bundles')
                      .replace(/kairos.docker.scarf.sh\/framework/g, 'quay.io/kairos/framework')
                      .replace(/kairos.docker.scarf.sh\/packages/g, 'quay.io/kairos/packages');
    }
}

function replaceContent(distroInfo) {
    let newDistroInfo = distroInfo;
    const highlightElements = document.querySelectorAll('.highlight');
    const metaDistroElements = document.querySelectorAll('.meta-distro');
    let onlyDistros = [];


    highlightElements.forEach(highlightElement => {
        let newDistroInfo = distroInfo;
        // Extract the class list
        const classList = highlightElement.className.split(' ');

        // Find the class that starts with "only-flavors="
        const flavorClass = classList.find(cls => cls.startsWith('only-flavors='));

        if (flavorClass) {
            // Extract the values part of the class
            const values = flavorClass.split('=')[1];
            const isList = values.includes(',');
            if (isList) {
                onlyDistros = values.split(',');
            } else {
                onlyDistros = [values];
            }
        } else {
            onlyDistros = [];
        }

        const distroInfoName = distroInfo[1].toLowerCase() + '+' + distroInfo[2];

        if (onlyDistros.length > 0 && !onlyDistros.map(distro => distro.toLowerCase()).includes(distroInfoName)) {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-warning autogenerated';
            alertDiv.setAttribute('role', 'alert');

            const alertHeading = document.createElement('h4');
            alertHeading.className = 'alert-heading';
            alertHeading.textContent = 'Flavor Incompatibility';

            const alertText = document.createElement('p');
            
            alertText.innerHTML = 'Your selected flavor is not compatible with this feature, the only available flavors for this feature are: ' + onlyDistros.join(', ').replace(/\+/g, ' ');

            // Append the heading and text to the alert div
            alertDiv.appendChild(alertHeading);
            alertDiv.appendChild(alertText);

            // Insert the new alert div above the highlight element
            highlightElement.parentNode.insertBefore(alertDiv, highlightElement);

            const release = onlyDistros[0].replace(/\+/g, ';').toLowerCase();
            const availableDistro = document.querySelector(`[data-distro$="${release}"]`).dataset.distro;
            newDistroInfo = availableDistro.split(';');
        }

        const preTags = highlightElement.querySelectorAll('code');
        const aTags = highlightElement.querySelectorAll('a');

        const elements = [...preTags, ...aTags];
        const analyticsState = document.getElementById('analytics-select').dataset.analyticsState;
        elements.forEach(e => {
            const newContent = replaceVariables(e.dataset.originalContent, newDistroInfo);
            const finalContent = replaceRepositories(newContent, analyticsState);
            e.innerHTML = decodeHTML(finalContent);
        });
        aTags.forEach(a => {
            a.href = replaceVariables(a.dataset.originalHref, newDistroInfo);

        });
    });

    metaDistroElements.forEach(e => {
        e.innerHTML = decodeHTML(replaceVariables(e.dataset.originalContent, newDistroInfo));
    });

    const distroSelect = document.getElementById('distro-select');
}

function onChange(distroSelect, analyticsState) {
    const generatedAlertElements = document.querySelectorAll('.alert-warning.autogenerated');
    generatedAlertElements.forEach(alert => {
        alert.remove();
    });
    const selectedDistro = distroSelect.dataset.distro;
    const selectedDistroArry = selectedDistro.split(';');
    const plausibleDistro = selectedDistroArry[1] + ' ' + selectedDistroArry[2];
    plausible('Change Flavor', { props: { distro: plausibleDistro, flavor: selectedDistroArry[1] } });
    localStorage.setItem('selectedDistro', selectedDistro);
    localStorage.setItem('useAnalytics', analyticsState);
    document.getElementById('analytics-select').dataset.analyticsState = analyticsState;
    const icon = document.getElementById(`analytics-${analyticsState}`).querySelector('i');
    document.getElementById('analytics-current-icon').className = icon.className;
    replaceContent(selectedDistro.split(';'));
}

document.addEventListener('DOMContentLoaded', () => {
    const distroSelect = document.getElementById('distro-select');
    const scarfSelect = document.getElementById('scarf-select');
    let distroInfo = [params.defaultFamily, params.defaultFlavor, params.defaultFlavorRelease];
    const highlightElements = document.querySelectorAll('.highlight');
    const metaDistroElements = document.querySelectorAll('.meta-distro');
    metaDistroElements.forEach(e => {
        e.dataset.originalContent = encodeHTML(e.innerHTML);
    });

    highlightElements.forEach(highlightElement => {
        const preElements = highlightElement.querySelectorAll('code');
        const aElements = highlightElement.querySelectorAll('a');
        const elements = [...preElements, ...aElements];
        elements.forEach((e, i) => {
            e.dataset.originalContent = encodeHTML(e.innerHTML);
        });
        aElements.forEach(a => {
            a.dataset.originalHref = a.href;
        });
    });

    const savedDistro = localStorage.getItem('selectedDistro');
    if (savedDistro) {
            distroInfo = savedDistro.split(';');
    }
    const defaultDistroValue = distroInfo.join(';');
    const displayName = document.querySelector(`[data-distro="${defaultDistroValue}"]`).textContent.trim();
    distroSelect.dataset.distro = defaultDistroValue;
    distroSelect.textContent = displayName;

    const savedAnalyticsState = localStorage.getItem('useAnalytics');
    if (savedAnalyticsState) {
        document.getElementById('analytics-select').dataset.analyticsState = savedAnalyticsState;
        const icon = document.getElementById(`analytics-${savedAnalyticsState}`).querySelector('i');
        document.getElementById('analytics-current-icon').className = icon.className;
    }

    const generatedAlertElements = document.querySelectorAll('.alert-warning.autogenerated');
    generatedAlertElements.forEach(alert => {
        alert.remove();
    });

    replaceContent(distroInfo);

    const distroOptions = document.querySelectorAll('.distro-option');
    distroOptions.forEach(option => {
        option.addEventListener('click', () => {
            distroSelect.dataset.distro = option.dataset.distro;
            distroSelect.textContent = option.textContent;
            onChange(distroSelect, document.getElementById('analytics-select').dataset.analyticsState);
        });
    });
    
    const analyticsOn = document.getElementById('analytics-on');
    analyticsOn.addEventListener('click', () => {
        onChange(distroSelect, 'on');
    });
    const analyticsOff = document.getElementById('analytics-off');
    analyticsOff.addEventListener('click', () => {
        onChange(distroSelect, 'off');
    });

    const infoIcon = document.getElementById("analytics-info");
    const analyticsModal = document.getElementById("analytics-modal");

    function showAnalyticsModal() {
        analyticsModal.style.display = "block";
    }

    function hideAnalyticsModal() {
        analyticsModal.style.display = "none";
    }

    infoIcon.addEventListener("mouseenter", showAnalyticsModal);
    analyticsModal.addEventListener("mouseenter", showAnalyticsModal);
    infoIcon.addEventListener("mouseleave", () => {
        setTimeout(() => {
            if (!analyticsModal.matches(':hover') && !infoIcon.matches(':hover')) {
                hideAnalyticsModal();
            }
        }, 100);
    });
    analyticsModal.addEventListener("mouseleave", () => {
        setTimeout(() => {
            if (!analyticsModal.matches(':hover') && !infoIcon.matches(':hover')) {
                hideAnalyticsModal();
            }
        }, 100);
    });

    // Send event when contact link is clicked for each partner
    const contactLinks = document.querySelectorAll('.contact-link');
    contactLinks.forEach(link => {
        link.addEventListener('click', () => {
            plausible('Contact Partner', { props: { partner: link.dataset.partner } });
        });
    });
});
