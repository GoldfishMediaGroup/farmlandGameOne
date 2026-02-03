(function () {
  "use strict";

  const config = {
    videos: {
      mobile: {
        src: "https://storage.yandexcloud.net/external-assets/tantum/modal-game/mobile.mp4",
        type: "video/mp4",
        pausePoints: [4.3, 10, 15, 20.5],
      },
      desktop: {
        src: "https://storage.yandexcloud.net/external-assets/tantum/modal-game/desktop.mp4",
        type: "video/mp4",
        pausePoints: [4.3, 10, 15, 20.5],
      },
    },
    buttonStyles: {
      desktop: {
        width: "130px",
        height: "130px",
      },
      mobile: {
        width: "130px",
        height: "130px",
      },
      imageUrl:
        "https://storage.yandexcloud.net/external-assets/tantum/modal-game/circle.png",
      videoUrl:
        "https://storage.yandexcloud.net/external-assets/tantum/modal-game/hello.png",
    },
    modalOverlayColor: "rgba(0, 0, 0, 0.7)",
    modalBackground: "transparent",
  };

  let videoButton = null;
  let modalOverlay = null;
  let videoElement = null;
  let buttonVideoElement = null;
  let currentPauseIndex = -1;
  let isPausedBySystem = false;
  let currentVideoConfig = null;
  let videoAspectRatio = 16 / 9;
  let isVideoFinished = false;

  function getDeviceType() {
    return window.innerWidth <= 768 ? "mobile" : "desktop";
  }

  function getButtonSize() {
    const device = getDeviceType();
    return config.buttonStyles[device];
  }

  document.addEventListener("DOMContentLoaded", function () {
    init();
  });

  function init() {
    createVideoButton();
    createModal();
    setupEventListeners();

    const isMobile = window.innerWidth <= 768;
    currentVideoConfig = config.videos[isMobile ? "mobile" : "desktop"];
    const source = document.createElement("source");
    source.src = currentVideoConfig.src;
    source.type = currentVideoConfig.type;
    videoElement.innerHTML = "";
    videoElement.appendChild(source);

    videoElement.addEventListener("loadedmetadata", function () {
      videoAspectRatio = videoElement.videoWidth / videoElement.videoHeight;
      updateModalSize();
    });
  }

  function createVideoButton() {
    videoButton = document.createElement("button");
    videoButton.id = "video-modal-trigger";

    const buttonSize = getButtonSize();

    const buttonDiv = document.createElement("div");
    buttonDiv.className = "video-button-content";

    const buttonImg = document.createElement("img");
    buttonImg.src = config.buttonStyles.imageUrl;
    buttonImg.alt = "Play video";
    buttonImg.loading = "lazy";
    buttonImg.className = "button-background-image";

    buttonVideoElement = document.createElement("video");
    buttonVideoElement.className = "button-overlay-video";
    buttonVideoElement.muted = true;
    buttonVideoElement.loop = true;
    buttonVideoElement.playsInline = true;
    buttonVideoElement.autoplay = true;

    const videoSource = document.createElement("source");
    videoSource.src = config.buttonStyles.videoUrl.replace(".png", ".mp4");
    videoSource.type = "video/mp4";
    buttonVideoElement.appendChild(videoSource);

    Object.assign(buttonImg.style, {
      width: "100%",
      height: "100%",
      objectFit: "contain",
      display: "block",
      position: "absolute",
      top: "0",
      left: "0",
      zIndex: "1",
    });

    Object.assign(buttonVideoElement.style, {
      width: "80%",
      height: "70%",
      objectFit: "contain",
      position: "absolute",
      top: "10%",
      left: "10%",
      zIndex: "2",
      borderRadius: "50%",
      pointerEvents: "none",
    });

    Object.assign(buttonDiv.style, {
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      position: "relative",
      borderRadius: "50%",
    });

    Object.assign(videoButton.style, {
      position: "fixed",
      bottom: "110px",
      right: "20px",
      width: buttonSize.width,
      height: buttonSize.height,
      backgroundColor: "transparent",
      border: "none",
      cursor: "pointer",
      borderRadius: "50%",
      zIndex: "1039",
      boxShadow: "0px 0px 50px rgba(0, 0, 0, 0.3)",
      overflow: "hidden",
      padding: "0",
    });

    buttonDiv.appendChild(buttonImg);
    buttonDiv.appendChild(buttonVideoElement);
    videoButton.appendChild(buttonDiv);

    document.body.appendChild(videoButton);

    setTimeout(() => {
      if (buttonVideoElement) {
        buttonVideoElement.play().catch((e) => {
          const fallbackImg = document.createElement("img");
          fallbackImg.src = config.buttonStyles.videoUrl;
          fallbackImg.alt = "Play video";
          fallbackImg.style.cssText = buttonVideoElement.style.cssText;
          buttonVideoElement.replaceWith(fallbackImg);
        });
      }
    }, 1000);
  }

  function createModal() {
    modalOverlay = document.createElement("div");
    modalOverlay.id = "video-modal-overlay";

    Object.assign(modalOverlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      backgroundColor: config.modalOverlayColor,
      display: "none",
      alignItems: "center",
      justifyContent: "center",
      zIndex: "1101",
      opacity: "0",
      transition: "opacity 0.3s ease",
      cursor: "pointer",
    });

    const modalContent = document.createElement("div");
    modalContent.id = "video-modal-content";

    Object.assign(modalContent.style, {
      backgroundColor: config.modalBackground,
      borderRadius: "12px",
      overflow: "hidden",
      position: "relative",
      transform: "translateY(30px)",
      transition: "transform 0.3s ease",
      cursor: "default",
      maxWidth: "90vw",
      maxHeight: "90vh",
    });

    const closeButton = document.createElement("button");
    closeButton.id = "video-modal-close";
    closeButton.title = "Закрыть";
    closeButton.setAttribute("aria-label", "Закрыть видео");
    closeButton.innerHTML = "×";

    Object.assign(closeButton.style, {
      position: "absolute",
      top: "10px",
      right: "10px",
      width: "30px",
      height: "30px",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      color: "white",
      border: "none",
      borderRadius: "50%",
      cursor: "pointer",
      fontSize: "20px",
      lineHeight: "30px",
      textAlign: "center",
      zIndex: "1101",
      transition: "background-color 0.3s ease",
    });

    closeButton.addEventListener("mouseenter", function () {
      closeButton.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    });

    closeButton.addEventListener("mouseleave", function () {
      closeButton.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    });

    videoElement = document.createElement("video");
    videoElement.className = "modal-video";
    videoElement.playsInline = true;
    videoElement.muted = true;
    videoElement.play();
    videoElement.disableRemotePlayback = true;
    videoElement.disablePictureInPicture = true;
    videoElement.controls = false;

    Object.assign(videoElement.style, {
      width: "100%",
      height: "100%",
      display: "block",
      cursor: "pointer",
      backgroundColor: "#000",
    });

    modalContent.appendChild(closeButton);
    modalContent.appendChild(videoElement);
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    addResponsiveStyles();
  }

  function updateModalSize() {
    const modalContent = document.getElementById("video-modal-content");
    if (!modalContent || !videoAspectRatio) return;

    const maxWidth = window.innerWidth * 0.9;
    const maxHeight = window.innerHeight * 0.9;

    let width = maxWidth;
    let height = width / videoAspectRatio;

    if (height > maxHeight) {
      height = maxHeight;
      width = height * videoAspectRatio;
    }

    modalContent.style.width = `${width}px`;
    modalContent.style.height = `${height}px`;
  }

  function addResponsiveStyles() {
    const style = document.createElement("style");
    style.textContent = `
            @media (max-width: 768px) {
                #video-modal-trigger {
                    width: 200px;
                    height: 200px;
                    bottom: 20px;
                    right: 20px;
                }
                
                #video-modal-trigger .button-overlay-video {
                    width: 70% !important;
                    height: 70% !important;
                    top: 15% !important;
                    left: 15% !important;
                }
                
                #video-modal-close {
                    top: 5px;
                    right: 5px;
                    width: 25px;
                    height: 25px;
                    font-size: 18px;
                    line-height: 25px;
                }
            }
            
            @media (max-width: 480px) {
                #video-modal-trigger {
                    width: 180px;
                    height: 180px;
                    bottom: 15px;
                    right: 15px;
                }
                
                #video-modal-trigger .button-overlay-video {
                    width: 65% !important;
                    height: 65% !important;
                    top: 17.5% !important;
                    left: 17.5% !important;
                }
            }
        `;
    document.head.appendChild(style);
  }

  function updateButtonSize() {
    const buttonSize = getButtonSize();
    videoButton.style.width = buttonSize.width;
    videoButton.style.height = buttonSize.height;
  }

  function setupEventListeners() {
    videoButton.addEventListener("click", openModal);

    const closeButton = document.getElementById("video-modal-close");
    closeButton.addEventListener("click", closeModal);

    modalOverlay.addEventListener("click", function (e) {
      if (e.target === modalOverlay) {
        closeModal();
      }
    });

    videoElement.addEventListener("click", handleVideoClick);

    videoElement.addEventListener("timeupdate", handleTimeUpdate);
    videoElement.addEventListener("ended", handleVideoEnded);

    videoElement.addEventListener("loadedmetadata", function () {
      if (modalOverlay.style.display === "flex") {
        updateModalSize();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modalOverlay.style.display === "flex") {
        closeModal();
      }
    });

    window.addEventListener("resize", function () {
      updateButtonSize();

      if (modalOverlay.style.display === "flex") {
        updateModalSize();
        handleResize();
      }
    });

    videoElement.addEventListener("contextmenu", function (e) {
      e.preventDefault();
      return false;
    });
  }

  function openModal() {
    isVideoFinished = false;

    modalOverlay.style.display = "flex";
    setTimeout(() => {
      modalOverlay.style.opacity = "1";
      document.getElementById("video-modal-content").style.transform =
        "translateY(0)";
    }, 10);

    document.body.style.overflow = "hidden";

    currentPauseIndex = -1;
    isPausedBySystem = false;

    updateModalSize();

    if (videoElement.readyState >= 2) {
      videoElement.currentTime = 0;
      setTimeout(() => {
        videoElement.play();
      }, 300);

      videoElement.play().catch((e) => console.log("Блокировка Safari:", e));
    } else {
      const playAfterLoad = function () {
        videoElement.removeEventListener("loadeddata", playAfterLoad);
        setTimeout(() => {
          videoElement.play();
        }, 300);
      };
      videoElement.addEventListener("loadeddata", playAfterLoad);
    }
  }

  function closeModal() {
    modalOverlay.style.opacity = "0";
    document.getElementById("video-modal-content").style.transform =
      "translateY(30px)";

    setTimeout(() => {
      modalOverlay.style.display = "none";
      videoElement.pause();
      document.body.style.overflow = "";
    }, 300);
  }

  function handleVideoClick() {
    if (isVideoFinished) {
      closeModal();
      return;
    }

    if (isPausedBySystem && videoElement.paused) {
      videoElement.play().then(() => {
        isPausedBySystem = false;
      });
    }
  }

  function handleTimeUpdate() {
    const currentTime = videoElement.currentTime;

    if (!isVideoFinished) {
      for (
        let i = currentPauseIndex + 1;
        i < currentVideoConfig.pausePoints.length;
        i++
      ) {
        const pausePoint = currentVideoConfig.pausePoints[i];

        if (currentTime >= pausePoint) {
          currentPauseIndex = i;
          pauseVideoAtPoint(pausePoint);
          break;
        }
      }
    }
  }

  function pauseVideoAtPoint(time) {
    isPausedBySystem = true;
    videoElement.pause();
    videoElement.currentTime = time;
  }

  function handleVideoEnded() {
    isVideoFinished = true;

    if (videoElement.duration > 0) {
      // videoElement.currentTime = videoElement.duration - 0.1;
      videoElement.pause();

      setTimeout(() => {
        videoElement.currentTime = videoElement.duration;
      }, 100);
    }

    currentPauseIndex = -1;
    isPausedBySystem = false;
  }

  function handleResize() {
    if (modalOverlay.style.display === "flex") {
      const isMobile = window.innerWidth <= 768;
      const newVideoConfig = config.videos[isMobile ? "mobile" : "desktop"];

      if (currentVideoConfig !== newVideoConfig) {
        const wasPlaying = !videoElement.paused && !isVideoFinished;
        const currentTime = videoElement.currentTime;

        const source = document.createElement("source");
        source.src = newVideoConfig.src;
        source.type = newVideoConfig.type;
        videoElement.innerHTML = "";
        videoElement.appendChild(source);
        videoElement.load();

        videoElement.currentTime = Math.min(
          currentTime,
          videoElement.duration || 0,
        );
        currentVideoConfig = newVideoConfig;
        currentPauseIndex = -1;
        isPausedBySystem = false;
        isVideoFinished = false;

        if (wasPlaying) {
          videoElement.play().catch(() => {});
        }
      }
    }
  }
})();
