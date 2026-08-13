// Tesseract.js handles its own worker by default.
Chart.register(ChartDataLabels);

document.addEventListener('DOMContentLoaded', () => {
    const i = {
        name: document.getElementById('studentName'),
        grade: document.getElementById('studentGrade'),
        mathS: document.getElementById('mathScore'), mathA: document.getElementById('mathAvg'), mathR: document.getElementById('mathRank'),
        logicS: document.getElementById('logicScore'), logicA: document.getElementById('logicAvg'), logicR: document.getElementById('logicRank'),
        verbalS: document.getElementById('verbalScore'), verbalA: document.getElementById('verbalAvg'), verbalR: document.getElementById('verbalRank'),
        spatialS: document.getElementById('spatialScore'), spatialA: document.getElementById('spatialAvg'), spatialR: document.getElementById('spatialRank'),
        observeS: document.getElementById('observeScore'), observeA: document.getElementById('observeAvg'), observeR: document.getElementById('observeRank'),
        creativeS: document.getElementById('creativeScore'), creativeA: document.getElementById('creativeAvg'), creativeR: document.getElementById('creativeRank'),
        avgS: document.getElementById('avgScore'), totalR: document.getElementById('totalRank')
    };

    const simSlider = document.getElementById('simSlider');
    const simVal = document.getElementById('simVal');
    const reportTitle = document.getElementById('reportTitle');
    const strengthBadges = document.getElementById('strengthBadges');
    
    // Upload Elements
    const uploadBox = document.getElementById('uploadBox');
    const imageUpload = document.getElementById('imageUpload');
    const uploadText = document.getElementById('uploadText');
    const analyzeBtn = document.getElementById('analyzeBtn');

    let ocrDataStore = null;
    let uploadedImageFile = null;

    Chart.defaults.font.family = "'Pretendard', -apple-system, sans-serif";
    
    const radarCtx = document.getElementById('radarChart').getContext('2d');
    
    // Radar Data Configuration
    // StartAngle: 30 shifts the hexagon so it has a flat top and bottom, and pointy left and right.
    // This creates a perfect vertical line split between left and right.
    // Index 0: 30deg (Top-Right) -> 공간지각 (Spatial)
    // Index 1: 90deg (Right) -> 관찰변별 (Observe)
    // Index 2: 150deg (Bottom-Right) -> 창의직관 (Creative)
    // Index 3: 210deg (Bottom-Left) -> 언어 (Verbal)
    // Index 4: 270deg (Left) -> 논리 (Logic)
    // Index 5: 330deg (Top-Left) -> 수리 (Math)
    
    let radarChart = new Chart(radarCtx, {
        type: 'radar',
        data: {
            labels: ['공간지각', '관찰/변별', '창의/직관', '언어/독해', '논리/추론', '수리/계산'],
            datasets: [
                {
                    label: '시뮬레이션 (기대치)',
                    data: [0, 0, 0, 0, 0, 0],
                    backgroundColor: 'rgba(52, 199, 89, 0.15)',
                    borderColor: 'rgba(52, 199, 89, 1)',
                    borderDash: [4, 4], borderWidth: 2, pointRadius: 0, fill: true, hidden: true,
                    datalabels: { display: false }
                },
                {
                    label: '현재 성취도',
                    data: [0,0,0,0,0,0],
                    backgroundColor: 'rgba(0, 122, 255, 0.25)',
                    borderColor: 'rgba(0, 122, 255, 1)',
                    pointBackgroundColor: '#fff', pointBorderColor: 'rgba(0, 122, 255, 1)',
                    pointBorderWidth: 2, pointRadius: 4, borderWidth: 2, fill: true,
                    datalabels: { display: false }
                },
                {
                    label: '전국 평균',
                    data: [0,0,0,0,0,0],
                    backgroundColor: 'rgba(255, 45, 85, 0.05)', 
                    borderColor: 'rgba(255, 45, 85, 0.5)',
                    borderWidth: 1.5, pointRadius: 0, fill: true,
                    datalabels: { display: false }
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                r: {
                    startAngle: 30, 
                    angleLines: { color: 'rgba(0,0,0,0.25)', lineWidth: 1 },
                    grid: { color: 'rgba(0,0,0,0.25)', lineWidth: 1 },
                    pointLabels: { 
                        font: { size: 13, weight: '600' }, 
                        color: '#1d1d1f'
                    },
                    ticks: { display: false, min: 0, max: 100 }
                }
            },
            plugins: { 
                legend: { position: 'bottom', labels: { boxWidth: 12, usePointStyle: true } },
                datalabels: { display: true }
            }
        }
    });

    const barCtx = document.getElementById('barChart').getContext('2d');
    let barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: ['종합 상대성취도', '전국상위(%)'],
            datasets: [
                { label: '현재 지표', data: [0,0], backgroundColor: ['rgba(0, 122, 255, 0.8)', 'rgba(88, 86, 214, 0.8)'], borderRadius: 8, barPercentage: 0.5 },
                { label: '시뮬레이션 지표', data: [0,0], backgroundColor: ['rgba(52, 199, 89, 0.6)', 'rgba(52, 199, 89, 0.6)'], borderRadius: 8, barPercentage: 0.5, hidden: true }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false, indexAxis: 'y',
            scales: {
                x: { min: 0, max: 100, grid: { color: 'rgba(0,0,0,0.05)' } },
                y: { grid: { display: false }, ticks: { font: { size: 13, weight: '600' }, color: '#1d1d1f' } }
            },
            plugins: { 
                legend: { display: true, position: 'bottom', labels: { boxWidth: 12, usePointStyle: true } },
                datalabels: {
                    color: '#fff',
                    font: { weight: 'bold' },
                    anchor: 'center',
                    align: 'center',
                    formatter: function(value) { return Number(value).toFixed(2); }
                }
            }
        }
    });

    function updateDashboard() {
        const name = i.name.value || "학생";
        reportTitle.textContent = `${name} 학생 사고력 정밀 분석 리포트`;

        // Left Brain: Math, Logic, Verbal
        // Right Brain: Spatial, Observe, Creative
        const scores = [
            parseFloat(i.mathS.value)||0, parseFloat(i.logicS.value)||0, parseFloat(i.verbalS.value)||0, 
            parseFloat(i.spatialS.value)||0, parseFloat(i.observeS.value)||0, parseFloat(i.creativeS.value)||0
        ];
        const avgs = [
            parseFloat(i.mathA.value)||0, parseFloat(i.logicA.value)||0, parseFloat(i.verbalA.value)||0, 
            parseFloat(i.spatialA.value)||0, parseFloat(i.observeA.value)||0, parseFloat(i.creativeA.value)||0
        ];
        const ranks = [
            parseFloat(i.mathR.value)||100, parseFloat(i.logicR.value)||100, parseFloat(i.verbalR.value)||100, 
            parseFloat(i.spatialR.value)||100, parseFloat(i.observeR.value)||100, parseFloat(i.creativeR.value)||100
        ];
        const domainNames = ['수리/계산', '논리/추론', '언어/독해', '공간/지각', '관찰/변별', '창의/직관'];

        // V6 Advanced Persona Engine (PDF Manual Integration)
        const baseAvg = parseFloat(i.avgS.value)||0;
        const maxScore = Math.max(...scores);
        const minScore = Math.min(...scores);
        const diff = maxScore - minScore;
        const maxIndex = scores.indexOf(maxScore);
        
        let totalText = "";
        if (baseAvg >= 50) {
            totalText = "이해의 속도가 매우 빠르고 문제해결능력이 상위권에 드는 매우 높은 수준(S등급)입니다. 스스로 교과를 이해하고 습득할 수 있는 자기주도 학습역량과 영재성이 엿보입니다. 이 패턴이 유지된다면 주입식 사교육에 의존하지 않고도 우수한 학업 성적을 올릴 수 있으므로, 장기적인 안목을 가지고 자기주도 학습을 체질화하도록 이끌어주세요.";
        } else if (baseAvg >= 40) {
            totalText = "이해의 속도가 평균보다 다소 빠르며(A등급), 학교 수업의 이해에는 전혀 지장이 없습니다. 자기주도 역량이 양호하므로, 문제해결을 사교육에 의존하기보다 스스로 도전할 수 있는 힘과 자신감을 만들어주는 것이 좋습니다.";
        } else if (baseAvg >= 30) {
            totalText = "이해의 속도는 보통 정도(B등급)이며, 본인은 이해한다고 생각하지만 실제로는 핵심을 놓치는 경우가 종종 있습니다. 집중력과 과제집착력이 어느 정도 수준인지 체크가 필요하며 예습보다는 복습 중심의 학습방법이 바람직합니다.";
        } else {
            totalText = "이해의 속도가 느린 편(C~D등급)이며 학교수업 내용을 잘 이해하지 못할 수 있습니다. 지식을 차근차근 익혀주는 보충학습과 여러 번의 반복학습이 필요하며, 아이가 좋아하는 분야를 적극 지원해 주어 동기를 부여하는 것이 좋습니다.";
        }

        let balanceType = "";
        let balanceText = "";
        if (diff <= 15) {
            balanceType = "매우 균형";
            balanceText = "여섯 가지 사고영역이 매우 고르게 발달하여 통합적 사고에 최적화되어 있습니다. 장애에 부딪혔을 때 대안을 모색하는 사고 전환이 원활하며 난이도가 높은 문제도 독자적인 방법으로 해결하려는 성향이 강합니다.";
        } else if (diff <= 25) {
            balanceType = "균형";
            balanceText = "사고영역들이 비교적 고르게 발달한 상태로 통합적 사고나 문제해결력도 우수합니다. 다만 어려운 문제에서는 2% 부족을 느낄 수 있으며, 난이도가 높은 문제를 만나면 집착하고 집중하는 역량이 약간 부족할 수 있습니다.";
        } else if (diff <= 35) {
            balanceType = "보통";
            balanceText = "일부 영역이 상대적으로 우수하거나 미흡하게 발달한 상태입니다. 선호하는 영역에서는 높은 이해도와 집중력을 보이나, 비선호 영역에서는 부분적으로 집중하지 못합니다. 문제를 다각적으로 보지 않고 빠르게 단정을 내릴 가능성이 있어 실수에 빠지기 쉽습니다.";
        } else {
            balanceType = "불균형";
            balanceText = "여섯 가지 사고영역들이 상당히 들쭉날쭉하게 발달한 상태이며, 좋아하는 것과 그렇지 않은 것의 편차가 매우 큽니다. 지식을 통합적으로 연결지어 맥락을 만들어내는 것을 어려워하며, 똑같이 어려운 문제라도 의외로 풀기도 하고 풀지 못하기도 하는 <strong>극심한 기복현상</strong>이 나타날 수 있습니다.";
        }

        const c1_text = `<p><strong>유형 분석: [성취도 ${baseAvg >= 50 ? '탁월' : (baseAvg >= 40 ? '우수' : '보통')} / 사고 ${balanceType}]</strong></p><p>${totalText}</p>`;
        const c2_text = `<p><strong>사고 균형 경고:</strong><br>${balanceText}</p>`;
        
        let c3_text = `<p><strong>강점 기반 코칭:</strong><br>현재 <strong>${domainNames[maxIndex]}</strong> 영역이 가장 돋보입니다. 아이가 강점을 발휘할 때 적극적으로 칭찬하여 약점 영역까지 시너지가 나도록 끌어올려 주어야 합니다.</p>`;
        c3_text += `<div class="highlight-text"><strong>전문가 가이드:</strong><br>특정 영역에 편중된 선행학습보다는 종합적인 사고의 그물을 촘촘히 엮어주어 심화 과정에서 무너지지 않게 대비해야 합니다. 부모님이 직접 풀어주기보다 "단서는 어디 있지?"라고 질문만 던져주세요.</div>`;

        document.getElementById('card1Content').innerHTML = c1_text;
        document.getElementById('card2Content').innerHTML = c2_text;
        document.getElementById('card3Content').innerHTML = c3_text;

        // Simulation Update
        const months = parseInt(simSlider.value);
        simVal.textContent = months === 0 ? "현재 (0개월)" : `훈련 ${months}개월 후`;
        const percentage = (months / 12) * 100;
        simSlider.style.background = `linear-gradient(to right, #34c759 ${percentage}%, #e5e5ea ${percentage}%)`;

        // Chart Data formatting for Left/Right split
        // Required mapping for chart: 
        // 0(Spatial), 1(Observe), 2(Creative) -> Right Brain
        // 3(Verbal), 4(Logic), 5(Math) -> Left Brain
        const mapToChart = (arr) => [arr[3], arr[4], arr[5], arr[2], arr[1], arr[0]];
        
        let futureScores = [...scores];
        let futureRanks = [...ranks];
        let baseRank = parseFloat(i.totalR.value)||100;
        let futureAvg = baseAvg; let futureRank = baseRank;

        if (months > 0) {
            const boostFactor = (months / 3) * 0.15; const baseGain = (months / 3) * 2; 
            for (let j = 0; j < 6; j++) {
                let boost = 0;
                if (scores[j] < 50) boost = Math.floor((100 - scores[j]) * boostFactor);
                futureScores[j] = Math.min(100, scores[j] + baseGain + boost);
                futureRanks[j] = Math.max(1, ranks[j] - (futureScores[j] - scores[j]) * 0.6);
            }
            radarChart.data.datasets[0].hidden = false;
            radarChart.data.datasets[0].data = mapToChart(futureScores);
            
            futureAvg = Math.round(Math.min(100, baseAvg + (months/3) * 2.5) * 100) / 100;
            futureRank = Math.round(Math.max(1, baseRank - (months/3) * 3.5) * 100) / 100;
            barChart.data.datasets[1].hidden = false;
            barChart.data.datasets[1].data = [futureAvg, futureRank];

            document.getElementById('card3Content').style.border = "2px solid var(--accent-green)";
        } else {
            radarChart.data.datasets[0].hidden = true;
            barChart.data.datasets[1].hidden = true;
            document.getElementById('card3Content').style.border = "none";
        }

        radarChart.data.datasets[1].data = mapToChart(scores);
        radarChart.data.datasets[2].data = mapToChart(avgs); // Pink Average line
        
        radarChart.data.labels = [
            `공간지각\n${futureScores[3].toFixed(2)}점`,
            `관찰/변별\n${futureScores[4].toFixed(2)}점`,
            `창의/직관\n${futureScores[5].toFixed(2)}점`,
            `언어/독해\n${futureScores[2].toFixed(2)}점`,
            `논리/추론\n${futureScores[1].toFixed(2)}점`,
            `수리/계산\n${futureScores[0].toFixed(2)}점`
        ];

        let badgesHtml = "";
        futureRanks.forEach((rank, idx) => {
            let bgStyle = rank <= 20 ? "background: var(--accent-red-light); color: var(--accent-red);" :
                          (rank <= 40 ? "background: var(--accent-blue-light); color: var(--accent-blue);" :
                          "background: #f5f5f7; color: #86868b;"); 
            badgesHtml += `<div class="badge" style="${bgStyle} font-size: 0.85rem; padding: 6px 12px; font-weight: 700; display: flex; justify-content: space-between;"><span>${domainNames[idx]}</span><span>▲ ${rank.toFixed(2)}%</span></div>`;
        });
        strengthBadges.innerHTML = badgesHtml;

        radarChart.update();

        barChart.data.datasets[0].data = [baseAvg, baseRank];
        barChart.update();
    }

    // --- Image Upload Logic ---
    uploadBox.addEventListener('click', () => imageUpload.click());
    uploadBox.addEventListener('dragover', (e) => { e.preventDefault(); uploadBox.classList.add('dragover'); });
    uploadBox.addEventListener('dragleave', () => uploadBox.classList.remove('dragover'));
    uploadBox.addEventListener('drop', (e) => {
        e.preventDefault(); uploadBox.classList.remove('dragover');
        if(e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });
    imageUpload.addEventListener('change', (e) => {
        if(e.target.files.length) handleFile(e.target.files[0]);
    });

    function handleFile(file) {
        if(!file.type.startsWith("image/")) { alert("이미지 파일만 업로드 가능합니다 (PNG, JPG 등)."); return; }
        uploadText.innerHTML = `<strong>${file.name}</strong> 준비 완료!`;
        uploadedImageFile = file;
        
        analyzeBtn.classList.remove('disabled');
        analyzeBtn.classList.add('active');
        analyzeBtn.disabled = false;
    }

    analyzeBtn.addEventListener('click', async () => {
        if(!uploadedImageFile) return;
        
        // Show Loading State
        analyzeBtn.innerHTML = '이미지 분석 중... (최대 10초)';
        analyzeBtn.disabled = true;
        
        try {
            const worker = await Tesseract.createWorker('kor');
            await worker.setParameters({
                tessedit_pageseg_mode: '6',
                tessedit_char_whitelist: '0123456789. '
            });
            const result = await worker.recognize(uploadedImageFile);
            ocrDataStore = result.data.text;
            await worker.terminate();
        } catch (e) {
            console.error(e);
            alert("이미지 분석 실패!");
            analyzeBtn.innerHTML = '데이터 분석하기';
            analyzeBtn.disabled = false;
            return;
        }
        
        const textClean = ocrDataStore.replace(/\s+/g, '');
        
        let foundName = null;
        let foundGrade = null;

        // 1. Try to find name from the title
        const titleMatch = textClean.match(/([가-힣]{2,4})학생의진단/);
        if (titleMatch) foundName = titleMatch[1];

        // 2. Try to find name directly after "이름"
        const nameKeywordMatch = textClean.match(/이름([가-힣]{2,4})(?=정오표|문제|\d)/);
        if (!foundName && nameKeywordMatch && !nameKeywordMatch[1].includes("학생")) {
            foundName = nameKeywordMatch[1];
        }

        // 3. Try to find Grade + Name combination (e.g., 2학년김도현)
        // Lookahead (?=정오표|문제|\d) prevents the greedy [가-힣]{2,4} from swallowing "정" from "정오표"
        const gradeNameMatch = textClean.match(/(\d)학년([가-힣]{2,4})(?=정오표|정오|문제|\d|$)/);
        if (gradeNameMatch) {
            if (!foundName && !gradeNameMatch[2].includes("학생") && !gradeNameMatch[2].includes("이름")) {
                foundName = gradeNameMatch[2];
            }
            foundGrade = gradeNameMatch[1];
        }

        // 4. Try to find School + Grade
        const schoolMatch = textClean.match(/(초등|중|고등)학교(\d)학년/);
        if (schoolMatch) {
            const type = schoolMatch[1] === "초등" ? "초" : (schoolMatch[1] === "중" ? "중" : "고");
            foundGrade = `${type}${schoolMatch[2]}`;
        } else if (foundGrade) {
            foundGrade = `초${foundGrade}`; // Default prefix
        }

        // Apply if found
        if (foundName) i.name.value = foundName;
        if (foundGrade) i.grade.value = foundGrade;

        const text = ocrDataStore;
        const lines = text.split('\n');
        
        function fixNumber(numStr) {
            if(!numStr) return 0;
            let val = parseFloat(numStr.replace(',', '.'));
            while (val > 100) {
                val = val / 10;
            }
            return val;
        }
        
        // Regex logic to find scores using line-by-line parsing
        const domains = [
            { key: "수리", inputS: i.mathS, inputA: i.mathA, inputR: i.mathR },
            { key: "논리", inputS: i.logicS, inputA: i.logicA, inputR: i.logicR },
            { key: "언어", inputS: i.verbalS, inputA: i.verbalA, inputR: i.verbalR },
            { key: "공간지각", inputS: i.spatialS, inputA: i.spatialA, inputR: i.spatialR },
            { key: "관찰과변별", inputS: i.observeS, inputA: i.observeA, inputR: i.observeR },
            { key: "창의직관", inputS: i.creativeS, inputA: i.creativeA, inputR: i.creativeR },
            { key: "종합", inputS: i.avgS, inputR: i.totalR } 
        ];

        // 1. 모든 줄을 스캔하여 숫자 데이터가 3개~6개 존재하는 '표의 행'을 찾아냅니다.
        const validRows = [];
        lines.forEach(line => {
            const nums = line.match(/\d+(?:[.,]\d+)?/g);
            if (nums && nums.length >= 3 && nums.length <= 6) {
                // 첫 번째 숫자가 100 이하인지 확인하여 날짜 등의 불필요한 행을 걸러냅니다.
                const firstNum = parseFloat(nums[0].replace(',', '.'));
                if (firstNum <= 100 && firstNum >= 0) {
                    validRows.push(line.trim());
                }
            }
        });

        // 2. 표의 행은 항상 7줄이므로, 발견된 순서대로 앞에서부터 7개를 도메인에 매핑합니다.
        const targetRows = validRows.slice(0, 7);
        
        // 문자가 섞이거나 오인식된 데이터를 강제로 숫자로 변환하는 특수 함수 (원장님 요청사항 완벽 반영)
        function forceNumber(str) {
            if (!str) return '0';
            // 자주 발생하는 OCR 문자 오인식을 숫자로 강제 매핑 (예: bb -> 66)
            let cleaned = str.toLowerCase()
                .replace(/b/g, '6')
                .replace(/o/g, '0')
                .replace(/l/g, '1')
                .replace(/i/g, '1')
                .replace(/s/g, '5')
                .replace(/z/g, '2')
                .replace(/g/g, '9')
                .replace(/q/g, '9')
                .replace(/t/g, '7')
                .replace(/!/g, '1')
                .replace(/\|/g, '1');
            
            // 숫자와 소수점만 남기고 모두 제거
            cleaned = cleaned.replace(/[^\d.]/g, '');
            
            // 소수점이 여러 개 찍혔을 경우 첫 번째만 남김
            const dotParts = cleaned.split('.');
            if (dotParts.length > 2) {
                cleaned = dotParts[0] + '.' + dotParts.slice(1).join('');
            }
            return cleaned || '0';
        }

        domains.forEach((d, index) => {
            if (index < targetRows.length) {
                const rawLine = targetRows[index].trim();
                
                // 해당 위치(Position)의 데이터만 정확히 가져오기 위해 공백 기준으로 분리
                const tokens = rawLine.split(/\s+/);
                
                // 표의 데이터는 항상 가장 마지막 5개 항목임
                let last5 = tokens.slice(-5);
                
                // 만약 인식된 토큰이 5개가 안 된다면 0으로 채움
                while(last5.length < 5) {
                    last5.unshift('0');
                }

                // 강제 숫자 변환 적용
                const nums = last5.map(t => forceNumber(t));

                if(d.key === "종합") {
                    d.inputS.value = fixNumber(nums[0]).toFixed(2);
                    d.inputR.value = fixNumber(nums[2]).toFixed(2);
                } else {
                    d.inputS.value = fixNumber(nums[0]).toFixed(2);
                    d.inputA.value = fixNumber(nums[1]).toFixed(2);
                    d.inputR.value = fixNumber(nums[2]).toFixed(2);
                }
            }
        });

        updateDashboard();
        
        // Reset button
        analyzeBtn.classList.remove('active');
        analyzeBtn.classList.add('disabled');
        analyzeBtn.innerHTML = '데이터 분석하기';
        analyzeBtn.disabled = true;
        uploadText.innerHTML = "분석 완료! 새로운 이미지를 넣으세요.";
        uploadedImageFile = null;
        
        // Trigger visual effect
        document.querySelector('.report-panel').style.opacity = '0.5';
        setTimeout(() => { document.querySelector('.report-panel').style.opacity = '1'; }, 300);
    });

    // Attach events
    Object.values(i).forEach(input => { if(input) input.addEventListener('input', updateDashboard); });
    simSlider.addEventListener('input', updateDashboard);

    updateDashboard();
});
