let cnv;
let ctx;
let svgPathData = [];
let selectedColor = '#ff0000';
let scaleFactor;
let offsetX, offsetY;
let canvasCloned = false;

let colorMapCanvas;
let colorMapCtx;

let svgWidth, svgHeight;

function setup() {
    // تحديد حجم الـ canvas ليكون بحجم نافذة المتصفح
    cnv = createCanvas(windowWidth, windowHeight);
    ctx = cnv.elt.getContext('2d');

    // تحميل ملف SVG
    loadSVG('assets/images/bee.svg');

    // تحديث اللون المختار
    const colorPicker = document.getElementById("colorPicker");
    colorPicker.addEventListener("input", (event) => {
        selectedColor = event.target.value;
    });
}

function draw() {
    background(220);
    if (svgPathData.length > 0) {
        drawSVGPaths();

        // بعد الرسم الأول، نقوم بإنشاء نسخة من الـ canvas
        if (!canvasCloned) {
            cloneCanvas();
            canvasCloned = true;
        }
    }
}

function windowResized() {
    // تحديث حجم الـ canvas عند تغيير حجم النافذة
    resizeCanvas(windowWidth, windowHeight);

    // إعادة حساب نسبة التحجيم والإزاحة
    calculateScaling();

    // إعادة إنشاء الـ Color Map Canvas
    recreateColorMapCanvas();

    // إعادة رسم الـ canvas الرئيسي
    drawSVGPaths();
}

// دالة لتحميل وتحليل SVG
async function loadSVG(url) {
    try {
        const response = await fetch(url);
        const text = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "image/svg+xml");
        const paths = xmlDoc.querySelectorAll('path');

        // تحديد أبعاد SVG
        const viewBox = xmlDoc.documentElement.getAttribute("viewBox").split(" ");
        svgWidth = parseFloat(viewBox[2]);
        svgHeight = parseFloat(viewBox[3]);

        // حساب نسبة التحجيم والإزاحة
        calculateScaling();

        // إنشاء الـ Color Map Canvas
        createColorMapCanvas();

        let colorId = 1;

        // إنشاء مسار الخلفية
        const backgroundPath = new Path2D();
        backgroundPath.rect(0, 0, svgWidth, svgHeight);

        // توليد لون فريد للخلفية
        const backgroundRegionColor = getColorFromId(colorId);

        // إضافة الخلفية إلى svgPathData
        svgPathData.push({
            path: backgroundPath,
            color: "#FFFFFF",      // اللون الافتراضي للخلفية على الـ canvas الرئيسي
            regionColor: backgroundRegionColor, // اللون الفريد للخلفية على الـ Color Map Canvas
            isBackground: true
        });

        colorId++;

        // رسم المسارات الأخرى
        paths.forEach(path => {
            const path2D = new Path2D(path.getAttribute('d'));

            // توليد لون فريد لكل منطقة
            const regionColor = getColorFromId(colorId);

            // إضافة المسار واللون إلى البيانات
            svgPathData.push({
                path: path2D,
                color: "#FFFFFF",      // اللون الافتراضي للتعبئة على الـ canvas الرئيسي
                regionColor: regionColor // اللون الفريد على الـ Color Map Canvas
            });

            colorId++;
        });

        // رسم الـ Color Map
        drawColorMap();
    } catch (error) {
        console.error('Error loading SVG:', error);
    }
}

// دالة لحساب نسبة التحجيم والإزاحة
function calculateScaling() {
    const scaleX = width / svgWidth;
    const scaleY = height / svgHeight;
    scaleFactor = Math.min(scaleX, scaleY);

    // حساب الإزاحات لتمركز الصورة
    offsetX = (width - svgWidth * scaleFactor) / 2;
    offsetY = (height - svgHeight * scaleFactor) / 2;
}

// دالة لإنشاء الـ Color Map Canvas
function createColorMapCanvas() {
    colorMapCanvas = document.createElement('canvas');
    colorMapCanvas.width = width;
    colorMapCanvas.height = height;
    colorMapCtx = colorMapCanvas.getContext('2d');
}

// دالة لإعادة إنشاء الـ Color Map Canvas عند تغيير حجم النافذة
function recreateColorMapCanvas() {
    colorMapCanvas.width = width;
    colorMapCanvas.height = height;
    colorMapCtx.clearRect(0, 0, width, height);

    // إعادة رسم الـ Color Map
    drawColorMap();
}

// دالة لرسم الـ Color Map
function drawColorMap() {
    colorMapCtx.clearRect(0, 0, width, height);

    colorMapCtx.save();
    colorMapCtx.translate(offsetX, offsetY);
    colorMapCtx.scale(scaleFactor, scaleFactor);

    // رسم الخلفية والمسارات
    svgPathData.forEach(item => {
        colorMapCtx.fillStyle = item.regionColor;
        if (item.isBackground) {
            colorMapCtx.fillRect(0, 0, svgWidth, svgHeight);
        } else {
            colorMapCtx.fill(item.path);
        }
    });

    colorMapCtx.restore();
}

// دالة لتوليد لون فريد من colorId
function getColorFromId(colorId) {
    const r = (colorId & 0xFF);
    const g = ((colorId >> 8) & 0xFF);
    const b = ((colorId >> 16) & 0xFF);
    return `rgb(${r},${g},${b})`;
}

// دالة لرسم المسارات مع تعبئة اللون الحالي
function drawSVGPaths() {
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scaleFactor, scaleFactor);

    // رسم الخلفية
    svgPathData.forEach(item => {
        if (item.isBackground) {
            ctx.fillStyle = item.color;
            ctx.fillRect(0, 0, svgWidth, svgHeight);
        }
    });

    // رسم المسارات الأخرى
    svgPathData.forEach(item => {
        if (!item.isBackground) {
            ctx.strokeStyle = "#000000";
            ctx.fillStyle = item.color;
            ctx.lineWidth = 2 / scaleFactor; // تعديل سمك الخط حسب التحجيم
            ctx.stroke(item.path);
            ctx.fill(item.path);
        }
    });

    ctx.restore();
}

// دالة لإنشاء نسخة من الـ canvas
function cloneCanvas() {
    // إنشاء عنصر canvas جديد
    const newCanvas = document.createElement('canvas');
    newCanvas.width = cnv.width;
    newCanvas.height = cnv.height;
    newCanvas.style.border = cnv.elt.style.border;  // نسخ نمط الحدود
    newCanvas.style.position = 'absolute'; // تمكين التمركز
    newCanvas.style.top = '0';
    newCanvas.style.left = '0';

    // نسخ محتوى الـ canvas الأصلي إلى الجديد
    const newCtx = newCanvas.getContext('2d');
    newCtx.drawImage(cnv.elt, 0, 0);

    // استبدال الـ canvas الأصلي بالجديد في DOM
    cnv.elt.parentNode.replaceChild(newCanvas, cnv.elt);

    // تحديث المراجع إلى الـ canvas والسياق الجديدين
    cnv.elt = newCanvas;
    ctx = newCtx;

    // إضافة مستمع حدث للنقر على الـ canvas الجديد
    newCanvas.addEventListener('mousedown', handleCanvasClick);
}

// دالة لمعالجة النقر على الـ canvas
function handleCanvasClick(event) {
    // الحصول على إحداثيات الماوس بالنسبة للـ canvas
    const rect = cnv.elt.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // تعديل الإحداثيات بالنسبة للتحجيم والتمركز
    const adjustedX = (x - offsetX) / scaleFactor;
    const adjustedY = (y - offsetY) / scaleFactor;

    // التحقق مما إذا كان النقر على أي من الخطوط (strokes)
    ctx.save();
    ctx.lineWidth = 2 / scaleFactor; // ضمان تطابق سمك الخط مع الرسم
    ctx.strokeStyle = "#000000"; // لون الخطوط

    let isOnStroke = false;
    for (let i = 0; i < svgPathData.length; i++) {
        const item = svgPathData[i];
        if (!item.isBackground) { // تجاهل الخلفية
            if (ctx.isPointInStroke(item.path, adjustedX, adjustedY)) {
                isOnStroke = true;
                break;
            }
        }
    }
    ctx.restore();

    if (isOnStroke) {
        // تجاهل النقر إذا كان على خط
        return;
    }

    // الآن نستمر في الحصول على لون البكسل من الـ Color Map Canvas
    const pixelData = colorMapCtx.getImageData(x, y, 1, 1).data;
    const clickedColor = `rgb(${pixelData[0]},${pixelData[1]},${pixelData[2]})`;

    // البحث عن المنطقة المطابقة للون
    for (let i = 0; i < svgPathData.length; i++) {
        const item = svgPathData[i];
        if (item.regionColor === clickedColor) {
            item.color = selectedColor; // تحديث اللون في الـ canvas الرئيسي
            break;
        }
    }

    // إعادة رسم الـ canvas الرئيسي بالألوان المحدثة
    drawSVGPaths();
}
