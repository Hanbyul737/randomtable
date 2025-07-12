class TableAssignmentGame {
    constructor() {
        this.tables = {};
        this.totalStudents = 0;
        this.totalTables = 7;
        this.isAssigning = false;
        
        // 테이블별 인원수 설정 (각 테이블마다 다른 인원수 가능)
        this.tableCapacities = [7, 7, 7, 7, 7, 7, 7]; // 기본값: 모든 테이블 7명
        
        // 주차 정보 관리
        this.parkingInfo = {}; // { studentName: { carNumber, tableNumber, registrationStatus, timestamp } }
        
        // 현재 결과 정보 (주차 등록을 위해)
        this.currentAssignment = { studentName: '', tableNumber: 0 };
        
        // 출석 정보 관리
        this.attendanceInfo = {}; // { studentName: { arrivalTime, attendanceStatus, tableNumber } }
        
        // 수업 시간 설정
        this.classStartTime = { hour: 11, minute: 0 }; // 11:00
        this.classEndTime = { hour: 14, minute: 0 };   // 14:00
        this.lateThreshold = 5; // 5분 후부터 지각
        
        // 연구원 명단 (김태희, 김미전 제외한 49명)
        this.studentList = [
            '고은희', '김민서', '김사라', '김선령', '김성희', '김영란', '김옥자', 
            '김정원', '김정화', '김필선', '김혜진', '김희용', '도민자', '박기성', 
            '박상현', '박시현', '박은선', '박진환', '백현주', '서혜원', '손미숙', 
            '송민경', '신황숙', '안국빈', '우정운', '윤정아', '이동은', '이명용', 
            '이영', '이영선', '이정근', '이주영', '이현주', '임선미', '장경옥', 
            '장재훈', '전명란', '전종숙', '전혜진', '정명희', '조윤재', '최경갑', 
            '최경자', '최금철', '최성희', '최수정', '홍성희', '홍현정', '황순임'
        ];
        
        // 한글 초성 배열
        this.chosung = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
        
        this.initializeTables();
        this.bindEvents();
        this.updateDisplay();
        this.setupAutocomplete();
        this.startClock();
    }

    initializeTables() {
        // 각 테이블 초기화 (테이블별 개별 인원수 설정)
        for (let i = 1; i <= this.totalTables; i++) {
            this.tables[i] = {
                number: i,
                students: [],
                currentSeats: 0,
                maxSeats: this.tableCapacities[i - 1] // 배열 인덱스는 0부터 시작
            };
        }
    }

    bindEvents() {
        const startBtn = document.getElementById('startBtn');
        const resetBtn = document.getElementById('resetBtn');
        const adminBtn = document.getElementById('adminBtn');
        const studentInput = document.getElementById('studentName');
        const closeResultBtn = document.querySelector('.close-result');
        const closeAdminBtn = document.querySelector('.close-admin');
        const saveSettingsBtn = document.getElementById('saveSettings');
        const cancelSettingsBtn = document.getElementById('cancelSettings');
        
        // 주차 관련 버튼들 (DOMContentLoaded 후에 다시 확인)
        
        // 엑셀 다운로드 버튼들

        startBtn.addEventListener('click', () => this.startAssignment());
        resetBtn.addEventListener('click', () => this.resetGame());
        adminBtn.addEventListener('click', () => this.showAdminModal());
        closeResultBtn.addEventListener('click', () => this.hideResultCard());
        closeAdminBtn.addEventListener('click', () => this.hideAdminModal());
        saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        cancelSettingsBtn.addEventListener('click', () => this.hideAdminModal());
        
        // 주차 관련 이벤트 (요소가 존재할 때만)
        this.bindDynamicEvents();
        
        // Enter 키로 배정 시작
        studentInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.isAssigning) {
                this.startAssignment();
            }
        });

        // 관리자 설정 실시간 업데이트
        document.getElementById('tableCount').addEventListener('input', () => this.updateAdminDisplay());
        document.getElementById('defaultSeatsPerTable').addEventListener('input', () => this.updateTotalCapacity());
        document.getElementById('studentListText').addEventListener('input', () => this.updateStudentCount());
        
        // 탭 전환 이벤트
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // 모든 테이블에 적용 버튼
        document.getElementById('applyToAllTables').addEventListener('click', () => this.applyToAllTables());

        // 입력 필드 자동 포커스
        studentInput.focus();
    }

    // 동적 요소들의 이벤트 바인딩
    bindDynamicEvents() {
        // 주차 관련 버튼들
        const parkingRegisterBtn = document.querySelector('.parking-register-btn');
        const closeParkingBtn = document.querySelector('.close-parking');
        const saveParkingBtn = document.getElementById('saveParkingInfo');
        const cancelParkingBtn = document.getElementById('cancelParking');
        const parkingSearchInput = document.getElementById('parkingSearch');
        const clearParkingSearchBtn = document.getElementById('clearParkingSearch');
        
        // 엑셀 다운로드 버튼들
        const downloadParkingExcelBtn = document.getElementById('downloadParkingExcel');
        const downloadStatusExcelBtn = document.getElementById('downloadStatusExcel');

        // 주차 관련 이벤트 (요소가 존재할 때만)
        if (parkingRegisterBtn) parkingRegisterBtn.addEventListener('click', () => this.showParkingModal());
        if (closeParkingBtn) closeParkingBtn.addEventListener('click', () => this.hideParkingModal());
        if (saveParkingBtn) saveParkingBtn.addEventListener('click', () => this.saveParkingInfo());
        if (cancelParkingBtn) cancelParkingBtn.addEventListener('click', () => this.hideParkingModal());
        if (parkingSearchInput) parkingSearchInput.addEventListener('input', () => this.filterParkingList());
        if (clearParkingSearchBtn) clearParkingSearchBtn.addEventListener('click', () => this.clearParkingSearch());
        
        // 엑셀 다운로드 이벤트 (요소가 존재할 때만)
        if (downloadParkingExcelBtn) downloadParkingExcelBtn.addEventListener('click', () => this.downloadParkingExcel());
        if (downloadStatusExcelBtn) downloadStatusExcelBtn.addEventListener('click', () => this.downloadStatusExcel());
    }

    updateDisplay() {
        // 전체 통계 업데이트
        const totalCapacity = this.getTotalCapacity();
        document.getElementById('totalStudents').textContent = this.totalStudents;
        document.getElementById('availableSeats').textContent = totalCapacity - this.totalStudents;

        // 각 테이블 상태 업데이트
        for (let i = 1; i <= this.totalTables; i++) {
            const table = this.tables[i];
            const tableElement = document.querySelector(`[data-table="${i}"]`);
            if (!tableElement) continue; // 테이블 요소가 없으면 스킵
            
            const currentSeatsElement = tableElement.querySelector('.current-seats');
            const seats = tableElement.querySelectorAll('.seat');

            currentSeatsElement.textContent = table.currentSeats;

            // 자리 표시 업데이트
            seats.forEach((seat, index) => {
                if (index < table.currentSeats) {
                    seat.classList.add('occupied');
                } else {
                    seat.classList.remove('occupied');
                }
            });

            // 테이블 상태에 따른 스타일링
            if (table.currentSeats >= table.maxSeats) {
                tableElement.classList.remove('available');
                tableElement.style.opacity = '0.7';
            } else {
                tableElement.classList.add('available');
                tableElement.style.opacity = '1';
            }
        }

        // 관리자 모달이 열려있고 현황 확인 탭이 활성화되어 있으면 업데이트
        const adminModal = document.getElementById('adminModal');
        const statusTab = document.querySelector('.tab-content[data-tab="status"]');
        if (!adminModal.classList.contains('hidden') && statusTab.classList.contains('active')) {
            this.updateAbsentStudents();
            this.updateTableStatus();
            this.updateAttendanceStats();
        }
    }

    async startAssignment() {
        const studentName = document.getElementById('studentName').value.trim();
        
        if (!studentName) {
            alert('연구원 이름을 입력해주세요!');
            document.getElementById('studentName').focus();
            return;
        }

        if (this.isAssigning) {
            return;
        }

        // 사용 가능한 테이블 확인
        const availableTables = this.getAvailableTables();
        if (availableTables.length === 0) {
            alert('모든 테이블이 만석입니다!');
            return;
        }

        this.isAssigning = true;
        this.setLoadingState(true);

        try {
            // 애니메이션과 함께 테이블 선택
            const selectedTable = await this.animateTableSelection(availableTables);
            
            // 학생 배정
            this.assignStudentToTable(studentName, selectedTable);
            
            // 결과 표시
            await this.showResult(studentName, selectedTable);
            
            // 입력 필드 초기화 및 포커스
            document.getElementById('studentName').value = '';
            document.getElementById('studentName').focus();
            
        } catch (error) {
            console.error('배정 중 오류 발생:', error);
            alert('배정 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            this.isAssigning = false;
            this.setLoadingState(false);
        }
    }

    getAvailableTables() {
        const available = [];
        for (let i = 1; i <= this.totalTables; i++) {
            if (this.tables[i].currentSeats < this.tables[i].maxSeats) {
                available.push(i);
            }
        }
        return available;
    }

    async animateTableSelection(availableTables) {
        return new Promise((resolve) => {
            let shuffleCount = 0;
            const maxShuffles = 15 + Math.floor(Math.random() * 10); // 15-25번 셔플
            
            // 모든 테이블에서 로딩 애니메이션 제거
            document.querySelectorAll('.table-item').forEach(table => {
                table.classList.remove('loading', 'highlight');
            });

            const shuffleInterval = setInterval(() => {
                // 이전 하이라이트 제거
                document.querySelectorAll('.table-item').forEach(table => {
                    table.classList.remove('highlight');
                });

                // 랜덤한 사용 가능한 테이블 하이라이트
                const randomIndex = Math.floor(Math.random() * availableTables.length);
                const tableNumber = availableTables[randomIndex];
                const tableElement = document.querySelector(`[data-table="${tableNumber}"]`);
                tableElement.classList.add('highlight');

                shuffleCount++;
                
                if (shuffleCount >= maxShuffles) {
                    clearInterval(shuffleInterval);
                    
                    // 최종 선택된 테이블 결정
                    const finalIndex = Math.floor(Math.random() * availableTables.length);
                    const selectedTable = availableTables[finalIndex];
                    
                    // 모든 하이라이트 제거 후 최종 선택 표시
                    setTimeout(() => {
                        document.querySelectorAll('.table-item').forEach(table => {
                            table.classList.remove('highlight');
                        });
                        
                        const finalTableElement = document.querySelector(`[data-table="${selectedTable}"]`);
                        finalTableElement.classList.add('highlight');
                        
                        setTimeout(() => {
                            resolve(selectedTable);
                        }, 500);
                    }, 200);
                }
            }, 100); // 100ms 간격으로 셔플
        });
    }

    assignStudentToTable(studentName, tableNumber) {
        const table = this.tables[tableNumber];
        
        if (table.currentSeats < table.maxSeats) {
            table.students.push(studentName);
            table.currentSeats++;
            this.totalStudents++;
            
            // 출석 정보 기록
            this.recordAttendance(studentName, tableNumber);
            
            // 자리 애니메이션 표시
            this.animateSeatFill(tableNumber);
            
            // 디스플레이 업데이트
            this.updateDisplay();
            
            return true;
        }
        
        return false;
    }

    animateSeatFill(tableNumber) {
        const tableElement = document.querySelector(`[data-table="${tableNumber}"]`);
        const seats = tableElement.querySelectorAll('.seat');
        const table = this.tables[tableNumber];
        
        // 마지막에 추가된 자리에 애니메이션 적용
        const lastSeatIndex = table.currentSeats - 1;
        if (seats[lastSeatIndex]) {
            setTimeout(() => {
                seats[lastSeatIndex].classList.add('occupied');
            }, 300);
        }
    }

    async showResult(studentName, tableNumber) {
        return new Promise((resolve) => {
            const resultCard = document.getElementById('resultCard');
            const resultStudent = document.querySelector('.result-student');
            const resultTable = document.querySelector('.result-table');
            
            // 현재 배정 정보 저장 (주차 등록을 위해)
            this.currentAssignment = { studentName, tableNumber };
            
            resultStudent.textContent = `${studentName} 연구원`;
            resultTable.textContent = `${tableNumber}번 테이블`;
            
            // 이미 주차 등록한 학생인지 확인
            const parkingBtn = document.querySelector('.parking-register-btn');
            if (this.parkingInfo[studentName]) {
                parkingBtn.textContent = '🚗 주차 등록 완료';
                parkingBtn.disabled = true;
                parkingBtn.style.opacity = '0.6';
            } else {
                parkingBtn.textContent = '🚗 주차 등록';
                parkingBtn.disabled = false;
                parkingBtn.style.opacity = '1';
            }
            
            // 결과 카드 표시
            resultCard.classList.remove('hidden');
            resultCard.classList.add('show');
            
            // 3초 후 자동 닫기 (옵션)
            setTimeout(() => {
                resolve();
            }, 1000);
        });
    }

    hideResultCard() {
        const resultCard = document.getElementById('resultCard');
        resultCard.classList.remove('show');
        resultCard.classList.add('hidden');
        
        // 테이블 하이라이트 제거
        document.querySelectorAll('.table-item').forEach(table => {
            table.classList.remove('highlight');
        });
    }

    setLoadingState(isLoading) {
        const startBtn = document.getElementById('startBtn');
        const studentInput = document.getElementById('studentName');
        
        if (isLoading) {
            startBtn.classList.add('loading');
            studentInput.disabled = true;
        } else {
            startBtn.classList.remove('loading');
            studentInput.disabled = false;
        }
    }

    resetGame() {
        if (this.isAssigning) {
            return;
        }

        const confirmReset = confirm('모든 테이블을 초기화하시겠습니까?');
        if (!confirmReset) {
            return;
        }

        // 모든 데이터 초기화
        this.initializeTables();
        this.totalStudents = 0;
        this.parkingInfo = {}; // 주차 정보도 초기화
        this.attendanceInfo = {}; // 출석 정보도 초기화
        this.currentAssignment = { studentName: '', tableNumber: 0 };
        
        // UI 초기화
        document.getElementById('studentName').value = '';
        this.hideResultCard();
        
        // 모든 테이블에서 스타일 제거
        document.querySelectorAll('.table-item').forEach(table => {
            table.classList.remove('highlight', 'loading', 'available');
            table.style.opacity = '1';
        });
        
        // 디스플레이 업데이트
        this.updateDisplay();
        
        // 입력 필드 포커스
        document.getElementById('studentName').focus();
        
        // 성공 메시지
        setTimeout(() => {
            alert('모든 테이블이 초기화되었습니다!');
        }, 100);
    }

    // 총 수용 인원 계산
    getTotalCapacity() {
        return this.tableCapacities.reduce((sum, capacity) => sum + capacity, 0);
    }

    // 테이블 정보 조회 메서드 (디버깅용)
    getTableInfo(tableNumber) {
        return this.tables[tableNumber];
    }

    // 전체 게임 상태 조회 메서드 (디버깅용)
    getGameStatus() {
        return {
            tables: this.tables,
            totalStudents: this.totalStudents,
            availableSeats: this.getTotalCapacity() - this.totalStudents,
            availableTables: this.getAvailableTables()
        };
    }

    // 한글 초성 추출 함수
    getChosung(str) {
        let result = '';
        for (let i = 0; i < str.length; i++) {
            const code = str.charCodeAt(i) - 44032;
            if (code > -1 && code < 11172) {
                result += this.chosung[Math.floor(code / 588)];
            } else {
                result += str.charAt(i);
            }
        }
        return result;
    }

    // 초성 검색 함수
    searchByChosung(query) {
        if (!query) return this.studentList;
        
        const searchChosung = this.getChosung(query);
        return this.studentList.filter(name => {
            const nameChosung = this.getChosung(name);
            return nameChosung.includes(searchChosung) || 
                   name.includes(query) ||
                   nameChosung.toLowerCase().includes(query.toLowerCase());
        });
    }

    // 자동완성 설정
    setupAutocomplete() {
        const studentInput = document.getElementById('studentName');
        let autocompleteContainer = document.createElement('div');
        autocompleteContainer.className = 'autocomplete-container';
        studentInput.parentNode.appendChild(autocompleteContainer);

        studentInput.addEventListener('input', (e) => {
            this.showAutocomplete(e.target.value, autocompleteContainer);
        });

        studentInput.addEventListener('blur', () => {
            setTimeout(() => {
                autocompleteContainer.style.display = 'none';
            }, 150);
        });
    }

    // 자동완성 표시
    showAutocomplete(query, container) {
        if (!query.trim()) {
            container.style.display = 'none';
            return;
        }

        const matches = this.searchByChosung(query).slice(0, 5); // 최대 5개만 표시
        
        if (matches.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.innerHTML = '';
        container.style.display = 'block';

        matches.forEach(name => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.textContent = name;
            item.addEventListener('click', () => {
                document.getElementById('studentName').value = name;
                container.style.display = 'none';
                document.getElementById('studentName').focus();
            });
            container.appendChild(item);
        });
    }

    // 관리자 모달 표시
    showAdminModal() {
        const modal = document.getElementById('adminModal');
        
        // 현재 설정값 로드
        document.getElementById('tableCount').value = this.totalTables;
        document.getElementById('defaultSeatsPerTable').value = this.tableCapacities[0] || 7;
        document.getElementById('studentListText').value = this.studentList.join('\n');
        
        // 관리자 화면 업데이트
        this.updateAdminDisplay();
        this.updateStudentCount();
        this.generateTableCapacityGrid();
        this.updateAbsentStudents();
        this.updateTableStatus();
        
        // 동적 이벤트 재바인딩
        setTimeout(() => {
            this.bindDynamicEvents();
        }, 100);
        
        modal.classList.remove('hidden');
        modal.classList.add('show');
    }

    // 관리자 모달 숨기기
    hideAdminModal() {
        const modal = document.getElementById('adminModal');
        modal.classList.remove('show');
        modal.classList.add('hidden');
    }

    // 관리자 화면 전체 업데이트
    updateAdminDisplay() {
        this.updateTotalCapacity();
        this.generateTableCapacityGrid();
        this.updateAbsentStudents();
        this.updateTableStatus();
        this.updateAttendanceStats();
    }

    // 총 수용 인원 업데이트
    updateTotalCapacity() {
        const totalCapacity = this.getTotalCapacity();
        document.getElementById('totalCapacity').textContent = totalCapacity;
    }

    // 연구원 수 업데이트
    updateStudentCount() {
        const studentListText = document.getElementById('studentListText').value;
        const students = studentListText.split('\n').filter(name => name.trim().length > 0);
        
        document.getElementById('studentCount').textContent = students.length;
    }

    // 설정 저장
    saveSettings() {
        try {
            const newTableCount = parseInt(document.getElementById('tableCount').value);
            const studentListText = document.getElementById('studentListText').value;
            const newStudentList = studentListText.split('\n').filter(name => name.trim().length > 0);

            // 유효성 검사
            if (newTableCount < 1 || newTableCount > 10) {
                alert('테이블 수는 1~10개 사이여야 합니다.');
                return;
            }

            // 테이블별 인원수 유효성 검사
            const hasInvalidCapacity = this.tableCapacities.some(capacity => capacity < 1 || capacity > 15);
            if (hasInvalidCapacity) {
                alert('테이블당 인원수는 1~15명 사이여야 합니다.');
                return;
            }

            if (newStudentList.length === 0) {
                alert('최소 1명 이상의 연구원이 등록되어야 합니다.');
                return;
            }

            // 현재 진행 중인 게임이 있는지 확인
            if (this.totalStudents > 0) {
                const confirm = window.confirm('현재 배정된 연구원들이 있습니다. 설정을 변경하면 모든 데이터가 초기화됩니다. 계속하시겠습니까?');
                if (!confirm) return;
            }

            // 테이블 수가 변경된 경우 배열 크기 조정
            if (newTableCount !== this.totalTables) {
                if (newTableCount > this.totalTables) {
                    // 테이블 추가 - 기본값으로 채움
                    const defaultCapacity = parseInt(document.getElementById('defaultSeatsPerTable').value) || 7;
                    while (this.tableCapacities.length < newTableCount) {
                        this.tableCapacities.push(defaultCapacity);
                    }
                } else {
                    // 테이블 제거 - 배열 자르기
                    this.tableCapacities = this.tableCapacities.slice(0, newTableCount);
                }
            }

            // 설정 적용
            this.totalTables = newTableCount;
            this.studentList = newStudentList;

            // 테이블 재생성
            this.initializeTables();
            this.totalStudents = 0;
            
            // UI 업데이트
            this.regenerateTablesHTML();
            this.updateDisplay();
            this.hideAdminModal();

            // 입력 필드 리셋 및 자동완성 재설정
            document.getElementById('studentName').value = '';
            this.setupAutocomplete();

            // 성공 메시지
            const totalCapacity = this.getTotalCapacity();
            alert(`설정이 저장되었습니다!\n테이블: ${newTableCount}개\n총 수용인원: ${totalCapacity}명\n등록된 연구원: ${newStudentList.length}명`);

        } catch (error) {
            console.error('설정 저장 중 오류:', error);
            alert('설정 저장 중 오류가 발생했습니다.');
        }
    }

    // 테이블 HTML 재생성
    regenerateTablesHTML() {
        const tablesGrid = document.querySelector('.tables-grid');
        tablesGrid.innerHTML = '';

        for (let i = 1; i <= this.totalTables; i++) {
            const tableElement = this.createTableElement(i);
            tablesGrid.appendChild(tableElement);
        }
    }

    // 테이블 요소 생성
    createTableElement(tableNumber) {
        const tableDiv = document.createElement('div');
        tableDiv.className = 'table-item';
        tableDiv.setAttribute('data-table', tableNumber);

        const tableMaxSeats = this.tableCapacities[tableNumber - 1];

        // 좌석 HTML 생성
        let seatsHTML = '';
        for (let i = 1; i <= tableMaxSeats; i++) {
            seatsHTML += `<div class="seat seat-${i}"></div>`;
        }

        tableDiv.innerHTML = `
            <div class="table-number">${tableNumber}번 테이블</div>
            <div class="table-seats">
                <span class="current-seats">0</span> / <span class="max-seats">${tableMaxSeats}</span>
            </div>
            <div class="table-visual">
                <div class="table-circle">
                    ${seatsHTML}
                </div>
            </div>
        `;

        return tableDiv;
    }

    // 탭 전환
    switchTab(tabName) {
        // 모든 탭 버튼과 콘텐츠 비활성화
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // 선택된 탭 활성화
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.querySelector(`.tab-content[data-tab="${tabName}"]`).classList.add('active');
        
        // 현황 확인 탭일 때 데이터 새로고침
        if (tabName === 'status') {
            this.updateAbsentStudents();
            this.updateTableStatus();
            this.updateAttendanceStats();
        }
        
        // 주차 관리 탭일 때 데이터 새로고침
        if (tabName === 'parking') {
            this.updateParkingDisplay();
        }
    }

    // 테이블별 인원수 설정 그리드 생성
    generateTableCapacityGrid() {
        const grid = document.getElementById('tableCapacityGrid');
        grid.innerHTML = '';

        for (let i = 0; i < this.totalTables; i++) {
            const item = document.createElement('div');
            item.className = 'table-capacity-item';
            
            item.innerHTML = `
                <label>${i + 1}번 테이블</label>
                <input type="number" min="1" max="15" value="${this.tableCapacities[i]}" 
                       data-table="${i}" class="table-capacity-input">
                <span>명</span>
            `;
            
            // 인원수 변경 이벤트
            const input = item.querySelector('input');
            input.addEventListener('input', (e) => {
                const tableIndex = parseInt(e.target.dataset.table);
                const newCapacity = parseInt(e.target.value) || 1;
                this.tableCapacities[tableIndex] = newCapacity;
                this.updateTotalCapacity();
            });
            
            grid.appendChild(item);
        }
    }

    // 모든 테이블에 기본값 적용
    applyToAllTables() {
        const defaultCapacity = parseInt(document.getElementById('defaultSeatsPerTable').value) || 7;
        
        for (let i = 0; i < this.totalTables; i++) {
            this.tableCapacities[i] = defaultCapacity;
        }
        
        this.generateTableCapacityGrid();
        this.updateTotalCapacity();
        
        alert(`모든 테이블에 ${defaultCapacity}명씩 적용되었습니다.`);
    }

    // 미도착자 명단 업데이트
    updateAbsentStudents() {
        const assignedStudents = new Set();
        
        // 배정된 연구원들 수집
        Object.values(this.tables).forEach(table => {
            table.students.forEach(student => assignedStudents.add(student));
        });
        
        // 미도착자 계산
        const absentStudents = this.studentList.filter(student => !assignedStudents.has(student));
        
        // 미도착자 목록 표시
        const absentList = document.getElementById('absentList');
        absentList.innerHTML = '';
        
        if (absentStudents.length === 0) {
            absentList.innerHTML = '<div style="text-align: center; color: #4caf50; font-weight: 600;">모든 연구원이 배정되었습니다! 🎉</div>';
        } else {
            absentStudents.forEach(student => {
                const item = document.createElement('div');
                item.className = 'absent-item';
                item.textContent = student;
                absentList.appendChild(item);
            });
        }
        
        // 통계 업데이트
        document.getElementById('totalRegistered').textContent = this.studentList.length;
        document.getElementById('totalAssigned').textContent = assignedStudents.size;
        document.getElementById('totalAbsent').textContent = absentStudents.length;
    }

    // 테이블별 현황 업데이트
    updateTableStatus() {
        const tableStatus = document.getElementById('tableStatus');
        tableStatus.innerHTML = '';

        for (let i = 1; i <= this.totalTables; i++) {
            const table = this.tables[i];
            const item = document.createElement('div');
            item.className = 'table-status-item';
            
            // 상태에 따른 클래스 추가
            if (table.currentSeats === 0) {
                item.classList.add('empty');
            } else if (table.currentSeats >= table.maxSeats) {
                item.classList.add('full');
            } else {
                item.classList.add('partial');
            }
            
            // 학생 목록 생성
            const studentList = table.students.length > 0 
                ? table.students.join(', ') 
                : '비어있음';
            
            item.innerHTML = `
                <h4>${i}번 테이블</h4>
                <div class="capacity">${table.currentSeats} / ${table.maxSeats}명</div>
                <div class="students">${studentList}</div>
            `;
            
            tableStatus.appendChild(item);
        }
    }

    // 주차 모달 표시
    showParkingModal() {
        const modal = document.getElementById('parkingModal');
        const studentNameSpan = document.querySelector('.parking-student-name');
        const tableNumberSpan = document.querySelector('.parking-table-number');
        const carNumberInput = document.getElementById('carNumber');
        
        // 현재 배정된 학생 정보 표시
        studentNameSpan.textContent = this.currentAssignment.studentName;
        tableNumberSpan.textContent = this.currentAssignment.tableNumber;
        
        // 입력 필드 초기화
        carNumberInput.value = '';
        carNumberInput.focus();
        
        // Enter 키 이벤트 (한 번만 추가되도록)
        carNumberInput.onkeypress = (e) => {
            if (e.key === 'Enter') {
                this.saveParkingInfo();
            }
        };
        
        modal.classList.remove('hidden');
        modal.classList.add('show');
    }

    // 주차 모달 숨기기
    hideParkingModal() {
        const modal = document.getElementById('parkingModal');
        modal.classList.remove('show');
        modal.classList.add('hidden');
    }

    // 주차 정보 저장
    saveParkingInfo() {
        const studentName = this.currentAssignment.studentName;
        const tableNumber = this.currentAssignment.tableNumber;
        const carNumber = document.getElementById('carNumber').value.trim();
        
        if (!carNumber) {
            alert('차량번호를 입력해주세요!');
            document.getElementById('carNumber').focus();
            return;
        }

        // 차량번호 중복 체크
        const existingCar = Object.values(this.parkingInfo).find(info => info.carNumber === carNumber);
        if (existingCar) {
            alert(`이미 등록된 차량번호입니다.\n등록자: ${existingCar.studentName || '알 수 없음'}`);
            return;
        }

        // 주차 정보 저장
        const now = new Date();
        this.parkingInfo[studentName] = {
            carNumber: carNumber,
            tableNumber: tableNumber,
            registrationStatus: false, // 등록 확인 대기
            timestamp: now.toLocaleString('ko-KR'),
            registrationDate: now.toLocaleDateString('ko-KR')
        };

        // 성공 메시지
        alert(`주차 정보가 등록되었습니다!\n연구원: ${studentName}\n테이블: ${tableNumber}번\n차량번호: ${carNumber}`);
        
        this.hideParkingModal();
        this.updateParkingDisplay();

        // 결과 카드의 주차 버튼 상태 업데이트
        const parkingBtn = document.querySelector('.parking-register-btn');
        parkingBtn.textContent = '🚗 주차 등록 완료';
        parkingBtn.disabled = true;
        parkingBtn.style.opacity = '0.6';
    }

    // 주차 현황 표시 업데이트
    updateParkingDisplay() {
        this.updateParkingStats();
        this.updateParkingList();
        this.updateNoParkingList();
    }

    // 주차 통계 업데이트
    updateParkingStats() {
        const totalRegistered = Object.keys(this.parkingInfo).length;
        const totalConfirmed = Object.values(this.parkingInfo).filter(info => info.registrationStatus).length;
        const totalPending = totalRegistered - totalConfirmed;

        document.getElementById('totalParkingRegistered').textContent = totalRegistered;
        document.getElementById('totalParkingConfirmed').textContent = totalConfirmed;
        document.getElementById('totalParkingPending').textContent = totalPending;
    }

    // 주차 목록 업데이트
    updateParkingList() {
        const parkingList = document.getElementById('parkingList');
        const searchQuery = document.getElementById('parkingSearch').value.toLowerCase();
        
        parkingList.innerHTML = '';

        const parkingEntries = Object.entries(this.parkingInfo).filter(([studentName, info]) => {
            if (!searchQuery) return true;
            return studentName.toLowerCase().includes(searchQuery) || 
                   info.carNumber.toLowerCase().includes(searchQuery);
        });

        if (parkingEntries.length === 0) {
            parkingList.innerHTML = '<div style="text-align: center; color: #666; padding: 40px;">등록된 주차 정보가 없습니다.</div>';
            return;
        }

        parkingEntries.forEach(([studentName, info]) => {
            const item = document.createElement('div');
            item.className = `parking-item ${info.registrationStatus ? 'confirmed' : 'pending'}`;
            
            item.innerHTML = `
                <div class="parking-item-header">
                    <div class="parking-student-name">${studentName}</div>
                    <div class="parking-table-info">${info.tableNumber}번 테이블</div>
                </div>
                <div class="parking-car-number">${info.carNumber}</div>
                <div class="parking-date-info">
                    <div class="parking-date">등록일: ${info.registrationDate || info.timestamp.split(' ')[0]}</div>
                    <div class="parking-time">등록시간: ${info.timestamp.split(' ')[1] || info.timestamp}</div>
                </div>
                <div class="parking-actions">
                    <div class="registration-check">
                        <input type="checkbox" id="check_${studentName}" 
                               ${info.registrationStatus ? 'checked' : ''}>
                        <label for="check_${studentName}">등록확인</label>
                    </div>
                </div>
            `;

            // 등록확인 체크박스 이벤트
            const checkbox = item.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', (e) => {
                this.parkingInfo[studentName].registrationStatus = e.target.checked;
                this.updateParkingDisplay();
                
                if (e.target.checked) {
                    item.classList.remove('pending');
                    item.classList.add('confirmed');
                } else {
                    item.classList.remove('confirmed');
                    item.classList.add('pending');
                }
            });

            parkingList.appendChild(item);
        });
    }

    // 주차 미등록 연구원 목록 업데이트
    updateNoParkingList() {
        const noParkingList = document.getElementById('noParkingList');
        
        // 배정된 연구원 중 주차 미등록자 찾기
        const assignedStudents = new Set();
        Object.values(this.tables).forEach(table => {
            table.students.forEach(student => assignedStudents.add(student));
        });
        
        const noParkingStudents = Array.from(assignedStudents).filter(student => !this.parkingInfo[student]);
        
        noParkingList.innerHTML = '';
        
        if (noParkingStudents.length === 0) {
            noParkingList.innerHTML = '<div style="text-align: center; color: #22c55e; font-weight: 600;">모든 배정된 연구원이 주차를 등록했습니다! 🎉</div>';
        } else {
            noParkingStudents.forEach(student => {
                const item = document.createElement('div');
                item.className = 'no-parking-item';
                item.textContent = student;
                noParkingList.appendChild(item);
            });
        }
    }

    // 주차 목록 검색 필터
    filterParkingList() {
        this.updateParkingList();
    }

    // 주차 검색 초기화
    clearParkingSearch() {
        document.getElementById('parkingSearch').value = '';
        this.updateParkingList();
    }

    // 시계 시작
    startClock() {
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
    }

    // 시계 업데이트
    updateClock() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('ko-KR', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
        
        const currentTimeElement = document.getElementById('currentTime');
        if (currentTimeElement) {
            currentTimeElement.textContent = `현재시간: ${timeString}`;
        }

        // 14시 이후에는 미도착자를 결석으로 처리
        if (now.getHours() >= this.classEndTime.hour) {
            this.processAbsentees();
        }
    }

    // 출석 기록
    recordAttendance(studentName, tableNumber) {
        const now = new Date();
        const arrivalTime = now.toLocaleTimeString('ko-KR', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        // 출석 상태 결정
        let attendanceStatus = this.determineAttendanceStatus(now);

        this.attendanceInfo[studentName] = {
            arrivalTime: arrivalTime,
            attendanceStatus: attendanceStatus,
            tableNumber: tableNumber,
            timestamp: now
        };
    }

    // 출석 상태 결정
    determineAttendanceStatus(arrivalTime) {
        const classStart = new Date();
        classStart.setHours(this.classStartTime.hour, this.classStartTime.minute, 0, 0);
        
        const lateThreshold = new Date();
        lateThreshold.setHours(this.classStartTime.hour, this.classStartTime.minute + this.lateThreshold, 0, 0);

        if (arrivalTime <= lateThreshold) {
            return '정시출석';
        } else {
            return '지각';
        }
    }

    // 결석자 처리 (14시 이후)
    processAbsentees() {
        const now = new Date();
        if (now.getHours() >= this.classEndTime.hour) {
            this.studentList.forEach(studentName => {
                if (!this.attendanceInfo[studentName]) {
                    this.attendanceInfo[studentName] = {
                        arrivalTime: '-',
                        attendanceStatus: '결석',
                        tableNumber: '-',
                        timestamp: now
                    };
                }
            });
        }
    }

    // 출석 현황 업데이트
    updateAttendanceStats() {
        let onTimeCount = 0;
        let lateCount = 0;
        let absentCount = 0;
        let notArrivedCount = 0;

        this.studentList.forEach(studentName => {
            const attendance = this.attendanceInfo[studentName];
            if (attendance) {
                switch (attendance.attendanceStatus) {
                    case '정시출석':
                        onTimeCount++;
                        break;
                    case '지각':
                        lateCount++;
                        break;
                    case '결석':
                        absentCount++;
                        break;
                }
            } else {
                // 14시 이후에는 결석으로 처리
                const now = new Date();
                if (now.getHours() >= this.classEndTime.hour) {
                    absentCount++;
                } else {
                    notArrivedCount++;
                }
            }
        });

        // UI 업데이트
        document.getElementById('onTimeCount').textContent = onTimeCount;
        document.getElementById('lateCount').textContent = lateCount;
        document.getElementById('absentCount').textContent = absentCount;
        document.getElementById('notArrivedCount').textContent = notArrivedCount;
    }

    // 주차 등록부 엑셀 다운로드
    downloadParkingExcel() {
        if (Object.keys(this.parkingInfo).length === 0) {
            alert('주차 등록 정보가 없습니다.');
            return;
        }

        const data = [];
        const headers = ['번호', '연구원명', '테이블번호', '차량번호', '등록일', '등록시간', '등록확인상태'];
        data.push(headers);

        let index = 1;
        Object.entries(this.parkingInfo).forEach(([studentName, info]) => {
            data.push([
                index++,
                studentName,
                `${info.tableNumber}번`,
                info.carNumber,
                info.registrationDate || info.timestamp.split(' ')[0],
                info.timestamp.split(' ')[1] || info.timestamp,
                info.registrationStatus ? '확인완료' : '등록대기'
            ]);
        });

        this.exportToExcel(data, 'KGLA_주차등록부');
    }

    // 출석 현황 엑셀 다운로드
    downloadStatusExcel() {
        // 먼저 결석자 처리 및 통계 업데이트
        this.processAbsentees();
        this.updateAttendanceStats();

        const data = [];
        const headers = ['번호', '연구원명', '출석상태', '도착시간', '테이블번호', '비고'];
        data.push(headers);

        let index = 1;
        this.studentList.forEach(studentName => {
            const attendance = this.attendanceInfo[studentName];
            const table = this.tables ? Object.values(this.tables).find(t => t.students.includes(studentName)) : null;
            
            let status, arrivalTime, tableNumber, note;
            
            if (attendance) {
                status = attendance.attendanceStatus;
                arrivalTime = attendance.arrivalTime;
                tableNumber = attendance.tableNumber !== '-' ? `${attendance.tableNumber}번` : '-';
                note = '';
                
                if (status === '지각') {
                    note = '11:05 이후 도착';
                } else if (status === '결석') {
                    note = '14:00까지 미도착';
                }
            } else {
                const now = new Date();
                if (now.getHours() >= this.classEndTime.hour) {
                    status = '결석';
                    arrivalTime = '-';
                    tableNumber = '-';
                    note = '14:00까지 미도착';
                } else {
                    status = '미도착';
                    arrivalTime = '-';
                    tableNumber = '-';
                    note = '아직 도착하지 않음';
                }
            }

            data.push([
                index++,
                studentName,
                status,
                arrivalTime,
                tableNumber,
                note
            ]);
        });

        this.exportToExcel(data, 'KGLA_출석현황');
    }

    // 엑셀 내보내기 공통 함수
    exportToExcel(data, filename) {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(data);
        
        // 열 너비 자동 조정
        const colWidths = [];
        data.forEach(row => {
            row.forEach((cell, index) => {
                const cellLength = String(cell).length;
                if (!colWidths[index] || colWidths[index] < cellLength) {
                    colWidths[index] = Math.max(cellLength + 2, 10);
                }
            });
        });
        ws['!cols'] = colWidths.map(width => ({ width }));

        XLSX.utils.book_append_sheet(wb, ws, '데이터');
        
        const now = new Date();
        const dateStr = now.toLocaleDateString('ko-KR').replace(/\./g, '').replace(/\s/g, '');
        const timeStr = now.toLocaleTimeString('ko-KR', { hour12: false }).replace(/:/g, '');
        
        XLSX.writeFile(wb, `${filename}_${dateStr}_${timeStr}.xlsx`);
        
        alert(`${filename} 파일이 다운로드되었습니다.`);
    }
}

// 페이지 로드 시 게임 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 게임 인스턴스 생성
    window.tableGame = new TableAssignmentGame();
    
    // 환영 메시지
    setTimeout(() => {
        console.log('🎉 KGLA 2025 홍익지도자 1학년 집중연구과정 테이블 배정 게임이 시작되었습니다!');
        console.log('💡 게임 상태 확인: window.tableGame.getGameStatus()');
    }, 1000);
});

// 키보드 단축키
document.addEventListener('keydown', (e) => {
    // ESC 키로 모달 닫기
    if (e.key === 'Escape') {
        const resultCard = document.getElementById('resultCard');
        const parkingModal = document.getElementById('parkingModal');
        const adminModal = document.getElementById('adminModal');
        
        if (!parkingModal.classList.contains('hidden')) {
            window.tableGame.hideParkingModal();
        } else if (!resultCard.classList.contains('hidden')) {
            window.tableGame.hideResultCard();
        } else if (!adminModal.classList.contains('hidden')) {
            window.tableGame.hideAdminModal();
        }
    }
    
    // Ctrl+R로 리셋 (기본 새로고침 방지)
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        window.tableGame.resetGame();
    }
}); 