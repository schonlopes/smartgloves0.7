var ws;
var statusElement = document.getElementById("status");
var messageElement = document.getElementById("message");
var voiceSelect = document.getElementById("voice");
var toggleSoundButton = document.getElementById("toggle-sound");
var soundEnabled = false;
var activeMessages = [];
var lastMessageTime = 0;

var chart;
var sensorData = {
  sensor1: [],
  sensor2: [],
  sensor3: [],
  sensor4: [],
  sensor5: []
};

// Função para abrir a conexão WebSocket
function connectWebSocket() {
  ws = new WebSocket("ws://192.168.0.200:81/");

  ws.onopen = function() {
    statusElement.innerText = "Conectado";
    statusElement.classList.remove("disconnected");
    statusElement.classList.add("connected");
    lastMessageTime = Date.now();
  };

  ws.onclose = function() {
    statusElement.innerText = "Desconectado";
    statusElement.classList.remove("connected");
    statusElement.classList.add("disconnected");
    setTimeout(connectWebSocket, 5000);
  };

  ws.onmessage = function(event) {
    lastMessageTime = Date.now();
    var sensorValues = event.data.trim().replace(/[\[\]]/g, '').split(",");

    var sensor1Degrees = convertToDegrees(parseInt(sensorValues[0]));
    var sensor2Degrees = convertToDegrees(parseInt(sensorValues[4]));
    var sensor3Degrees = convertToDegrees(parseInt(sensorValues[2]));
    var sensor4Degrees = convertToDegrees(parseInt(sensorValues[3]));
    var sensor5Degrees = convertToDegrees(parseInt(sensorValues[1]));

    document.getElementById("sensor1").innerText = "Sensor 1: " + sensor1Degrees + "°";
    document.getElementById("sensor2").innerText = "Sensor 2: " + sensor2Degrees + "°";
    document.getElementById("sensor3").innerText = "Sensor 3: " + sensor3Degrees + "°";
    document.getElementById("sensor4").innerText = "Sensor 4: " + sensor4Degrees + "°";
    document.getElementById("sensor5").innerText = "Sensor 5: " + sensor5Degrees + "°";

    // Exibe mensagens baseadas nos valores dos sensores
    if (parseInt(sensorValues[0]) < 400) showMessage("1", "Estou com SEDE");
    if (parseInt(sensorValues[4]) < 400) showMessage("2", "Estou com FOME");
    if (parseInt(sensorValues[2]) < 400) showMessage("3", "Preciso ir ao BANHEIRO");
    if (parseInt(sensorValues[3]) < 400) showMessage("4", "Sinto DOR");
    if (parseInt(sensorValues[1]) < 400) showMessage("5", "EU TE AMO");

    // Adicionar os valores dos sensores ao gráfico
    updateChart(sensor1Degrees, sensor2Degrees, sensor3Degrees, sensor4Degrees, sensor5Degrees);
  };
}

// Função para criar o gráfico
function createChart() {
  var ctx = document.getElementById("sensorChart").getContext("2d");
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        { label: "Sensor 1", data: [], borderColor: "red", fill: false },
        { label: "Sensor 2", data: [], borderColor: "blue", fill: false },
        { label: "Sensor 3", data: [], borderColor: "green", fill: false },
        { label: "Sensor 4", data: [], borderColor: "orange", fill: false },
        { label: "Sensor 5", data: [], borderColor: "purple", fill: false }
      ]
    },
    options: {
      scales: {
        x: { display: true },
        y: { display: true, min: 0, max: 180 }
      }
    }
  });
}

// Função para atualizar o gráfico
function updateChart(sensor1, sensor2, sensor3, sensor4, sensor5) {
  if (chart) {
    chart.data.labels.push("");
    chart.data.datasets[0].data.push(sensor1);
    chart.data.datasets[1].data.push(sensor2);
    chart.data.datasets[2].data.push(sensor3);
    chart.data.datasets[3].data.push(sensor4);
    chart.data.datasets[4].data.push(sensor5);
    chart.update();
  }
}

// Converter valores para graus (escala de 0 a 180)
function convertToDegrees(sensorValue) {
  if (sensorValue >= 490) return 0;
  else if (sensorValue <= 270) return 180;
  var degrees = (1 - (sensorValue - 270) / (490 - 270)) * 180;
  return Math.round(degrees);
}

// Função para mostrar uma mensagem na tela por 10 segundos
function showMessage(sensor, text) {
  if (!activeMessages.includes(sensor)) {
    activeMessages.push(sensor);
    messageElement.classList.add("alert");
    messageElement.innerText = text;
    playSound(sensor);

    setTimeout(function() {
      activeMessages = activeMessages.filter(function(item) { return item !== sensor; });
      if (activeMessages.length === 0) {
        messageElement.innerText = "";
        messageElement.classList.remove("alert");
      }
    }, 10000);
  }
}

// Função para tocar o som correspondente à mensagem
var audio;
function playSound(sensor) {
  if (soundEnabled) {
    var selectedVoice = voiceSelect.value;
    var soundPath = `Sons/${selectedVoice}/${sensor}.mp3`;
    if (audio) audio.pause(); // Pausa qualquer som anterior
    audio = new Audio(soundPath);
    audio.play();
  }
}

// Alternar som
toggleSoundButton.addEventListener('click', function() {
  soundEnabled = !soundEnabled;
  toggleSoundButton.innerText = soundEnabled ? "Desativar Som" : "Ativar Som";
});

// Função para trocar de aba
function openTab(evt, tabName) {
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablink");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].classList.remove("active");
  }
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.classList.add("active");

  if (tabName === 'Grafico') {
    soundEnabled = false;
    toggleSoundButton.innerText = "Ativar Som";
  } 
  
  else if (chart) {
    // Redefinir os dados do gráfico
    chart.data.labels = [];
    chart.data.datasets.forEach(dataset => dataset.data = []);
    chart.update();
  }

  if (tabName === 'Grafico' && !chart) {
    createChart(); // Cria o gráfico apenas uma vez
  }
}

// Chamada inicial da função para exibir a aba "Sensores"
openTab({currentTarget: document.querySelector('.tablink')}, 'Sensores');

// Conectar ao WebSocket ao carregar a página
connectWebSocket();

var themeSwitch = document.getElementById("theme-switch");

themeSwitch.addEventListener("change", function() {
  if (this.checked) {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }
});
