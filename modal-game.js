(function () {
  "use strict";

  //  Конфигурация приложения: пути к видео, точки пауз и стили кнопок
  const config = {
    videos: {
      mobile: {
        src: "https://storage.yandexcloud.net/external-assets/tantum/modal-game/mobile.mp4",
        type: "video/mp4",
        pausePoints: [4.5, 10, 15, 20.5],
      },
      desktop: {
        src: "https://storage.yandexcloud.net/external-assets/tantum/modal-game/desktop.mp4",
        type: "video/mp4", // Точки пауз для десктопа (с дробными значениями)
        pausePoints: [4.25, 10, 15, 20.5],
      },
    },
    buttonStyles: {
      desktop: { width: "130px", height: "130px" },
      mobile: { width: "130px", height: "130px" },
      imageUrl:
        "https://storage.yandexcloud.net/external-assets/tantum/modal-game/circle.png",
      videoUrl:
        "https://storage.yandexcloud.net/external-assets/tantum/modal-game/hello.png",
    },
    modalOverlayColor: "rgba(0, 0, 0, 0.7)",
    modalBackground: "transparent",
  };

  // Глобальные переменные состояния
  let videoButton = null; // Кнопка-триггер на странице
  let modalOverlay = null; // Оверлей модального окна
  let videoElement = null; // Основной видео-плеер в модальном окне
  let buttonVideoElement = null; // Видео внутри кнопки-триггера
  let currentPauseIndex = -1; // Индекс текущей/пройденной точки паузы
  let isPausedBySystem = false; // Флаг: поставлено ли видео на паузу скриптом
  let currentVideoConfig = null; // Текущий конфиг видео (зависит от устройства)
  let videoAspectRatio = 16 / 9; // Соотношение сторон видео по умолчанию
  let isVideoFinished = false; // Флаг: закончилось ли воспроизведение полностью
  let rafId = null; // ID кадра анимации для высокоточного таймера

  // Определяет тип устройства на основе ширины экрана

  function getDeviceType() {
    return window.innerWidth <= 768 ? "mobile" : "desktop";
  }

  // Возвращает размеры кнопки из конфига для текущего типа устройства

  function getButtonSize() {
    const device = getDeviceType();
    return config.buttonStyles[device];
  }

  // Инициализация при загрузке DOM
  document.addEventListener("DOMContentLoaded", function () {
    init();
  });

  // Главная функция инициализации: создает элементы, вешает события и настраивает видео

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

    // Получаем реальные пропорции видео после загрузки метаданных
    videoElement.addEventListener("loadedmetadata", function () {
      videoAspectRatio = videoElement.videoWidth / videoElement.videoHeight;
      updateModalSize();
    });
  }

  // Создает плавающую кнопку-триггер с видео-превью и фоновым изображением

  function createVideoButton() {
    videoButton = document.createElement("button");
    videoButton.id = "video-modal-trigger";

    const buttonSize = getButtonSize();

    const buttonDiv = document.createElement("div");
    buttonDiv.className = "video-button-content";

    // Фоновая картинка кнопки
    const buttonImg = document.createElement("img");
    buttonImg.src = config.buttonStyles.imageUrl;
    buttonImg.alt = "Play video";
    buttonImg.loading = "lazy";
    buttonImg.className = "button-background-image";

    // Видео внутри кнопки
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

    // Применение стилей к элементам кнопки
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

    // Автозапуск видео на кнопке с фоллбеком на статику при блокировке браузером
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

  // Создает структуру модального окна и видеоплеера

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
      display: "flex",
      flexShrink: 0,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      color: "white",
      border: "none",
      borderRadius: "50%",
      cursor: "pointer",
      fontSize: "20px",
      lineHeight: "100%",
      textAlign: "center",
      zIndex: "1101",
      transition: "background-color 0.3s ease",
      padding: 0,
    });

    // Эффекты наведения для кнопки закрытия
    closeButton.addEventListener(
      "mouseenter",
      () => (closeButton.style.backgroundColor = "rgba(0, 0, 0, 0.7)"),
    );
    closeButton.addEventListener(
      "mouseleave",
      () => (closeButton.style.backgroundColor = "rgba(0, 0, 0, 0.5)"),
    );

    videoElement = document.createElement("video");
    videoElement.className = "modal-video";
    videoElement.playsInline = true;
    videoElement.muted = true;
    videoElement.preload = "auto";
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

  //Динамически рассчитывает размер модального окна, сохраняя пропорции видео

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

  //Добавляет CSS-стили для адаптивности через тег <style>

  function addResponsiveStyles() {
    const style = document.createElement("style");
    style.textContent = `
            @media (max-width: 768px) {
                #video-modal-trigger { width: 200px; height: 200px; bottom: 20px; right: 20px; }
                #video-modal-trigger .button-overlay-video { width: 70% !important; height: 70% !important; top: 15% !important; left: 15% !important; }
                #video-modal-close { top: 5px; right: 5px; width: 25px; height: 25px; font-size: 18px; line-height: 25px; }
            }
            @media (max-width: 480px) {
                #video-modal-trigger { width: 180px; height: 180px; bottom: 15px; right: 15px; }
                #video-modal-trigger .button-overlay-video { width: 65% !important; height: 65% !important; top: 17.5% !important; left: 17.5% !important; }
            }
        `;
    document.head.appendChild(style);
  }

  // Обновляет размер кнопки-триггера при ресайзе

  function updateButtonSize() {
    const buttonSize = getButtonSize();
    videoButton.style.width = buttonSize.width;
    videoButton.style.height = buttonSize.height;
  }

  //Устанавливает все слушатели событий (клики, клавиши, ресайз)

  function setupEventListeners() {
    videoButton.addEventListener("click", openModal);

    const closeButton = document.getElementById("video-modal-close");
    closeButton.addEventListener("click", closeModal);

    modalOverlay.addEventListener("click", function (e) {
      if (e.target === modalOverlay) closeModal();
    });

    videoElement.addEventListener("click", handleVideoClick);
    videoElement.addEventListener("ended", handleVideoEnded);

    videoElement.addEventListener("loadedmetadata", function () {
      if (modalOverlay.style.display === "flex") updateModalSize();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modalOverlay.style.display === "flex")
        closeModal();
    });

    window.addEventListener("resize", function () {
      updateButtonSize();
      if (modalOverlay.style.display === "flex") {
        updateModalSize();
        handleResize();
      }
    });

    videoElement.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  //Открывает модальное окно и запускает воспроизведение видео

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
    videoElement.play();

    startPreciseTimer();
  }

  // Высокоточный таймер на базе requestAnimationFrame.
  //Следит за временем видео и ставит на паузу в нужных точках.

  function startPreciseTimer() {
    const checkTime = () => {
      if (videoElement.paused || isVideoFinished) {
        rafId = null;
        return;
      }

      const currentTime = videoElement.currentTime;
      const nextPoint = currentVideoConfig.pausePoints[currentPauseIndex + 1];

      if (nextPoint !== undefined) {
        // Проверка принудительной паузы за 0.1 сек до цели для предотвращения перелета
        if (currentTime >= nextPoint - 0.1) {
          videoElement.pause();
          videoElement.currentTime = nextPoint; // Мгновенный довод до точного кадра

          currentPauseIndex++;
          isPausedBySystem = true;
          rafId = null;
          return;
        }
      }

      rafId = requestAnimationFrame(checkTime);
    };
    rafId = requestAnimationFrame(checkTime);
  }

  // Обработчик клика по видео.
  //Реализует логику возобновления и клика "на опережение" за 1 сек до паузы.

  function handleVideoClick() {
    if (isVideoFinished) {
      closeModal();
      return;
    }

    const currentTime = videoElement.currentTime;
    const nextPoint = currentVideoConfig.pausePoints[currentPauseIndex + 1];

    // Если видео на паузе, возобновляем воспроизведение
    if (isPausedBySystem && videoElement.paused) {
      isPausedBySystem = false;
      videoElement.currentTime += 0.04; // Микро-шаг вперед для выхода из зоны паузы
      videoElement.play().then(() => {
        if (!rafId) startPreciseTimer();
      });
      return;
    }

    // ЛОГИКА ОПЕРЕЖЕНИЯ: Если до паузы < 1с, "проглатываем" точку, не останавливаясь
    if (nextPoint !== undefined && nextPoint - currentTime <= 1.0) {
      currentPauseIndex++;
      console.log("Клик засчитан заранее для точки:", nextPoint);
    }
  }

  // Закрывает модальное окно, сбрасывает видео и таймеры

  function closeModal() {
    modalOverlay.style.opacity = "0";
    document.getElementById("video-modal-content").style.transform =
      "translateY(30px)";

    if (rafId) cancelAnimationFrame(rafId);

    setTimeout(() => {
      modalOverlay.style.display = "none";
      videoElement.currentTime = 0;
      videoElement.pause();
      document.body.style.overflow = "";
    }, 300);
  }

  // Обработка завершения видео

  function handleVideoEnded() {
    isVideoFinished = true;
    if (videoElement.duration > 0) {
      videoElement.pause();
      setTimeout(() => {
        videoElement.currentTime = videoElement.duration;
      }, 100);
    }
    currentPauseIndex = -1;
    isPausedBySystem = false;
  }

  // Обработка ресайза окна для смены конфига видео (мобильное/десктоп) "на лету"

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
