
const newTaskBtn = document.getElementById("newTaskBtn");

const taskList = document.getElementById("taskList");
const searchInput = document.getElementById("searchInput");
const viewTitle = document.getElementById("viewTitle");
const sidebarButtons = document.querySelectorAll(".sidebar-view");

// Our single source of task data
let tasks = [];
let currentView = "all";

// Restore saved tasks from the browser
function loadTasks() {
  try {
    const savedTasks = localStorage.getItem("taskflow.tasks");
    const parsedTasks = savedTasks ? JSON.parse(savedTasks) : [];

    tasks = Array.isArray(parsedTasks) ? parsedTasks : [];
  } catch (error) {
    tasks = [];
    console.error("Could not load saved tasks:", error);
  }
}

// Save tasks in the browser
function saveTasks() {
  localStorage.setItem("taskflow.tasks", JSON.stringify(tasks));
}

// Open the new-task form
newTaskBtn.addEventListener("click", function () {

  const taskTitle = searchInput.value.trim();

  if (taskTitle === "") {
    return;
  }

  const newTask = {
    id: crypto.randomUUID(),
    title: taskTitle,
    completed: false,
    important: false,
    dueSoon: false,
    removed: false
  };

  tasks.push(newTask);

  saveTasks();

  currentView ="all";
  searchInput.value = "";

  renderTasks();

});

// Change the selected sidebar view
sidebarButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    currentView = button.dataset.view;
    searchInput.value = "";
    renderTasks();
  });
});

// Create and display the visible task cards
function renderTasks() {
  taskList.replaceChildren();

  const headings = {
    all: "TO-DO",
    important: "Important",
    completed: "Completed",
    removed: "Removed",
    "due-soon": "Due Soon"
  };

  viewTitle.textContent = headings[currentView] || "TO-DO";

  sidebarButtons.forEach(function (button) {
    button.classList.toggle(
      "active",
      button.dataset.view === currentView
    );
  });

  const query = searchInput.value.trim().toLowerCase();

  const visibleTasks = tasks.filter(function (task) {
    let matchesView = false;

    if (currentView === "all") {
      matchesView = !task.removed;
    } else if (currentView === "important") {
      matchesView = task.important && !task.removed;
    } else if (currentView === "completed") {
      matchesView = task.completed && !task.removed;
    } else if (currentView === "removed") {
      matchesView = task.removed;
    } else if (currentView === "due-soon") {
      matchesView = task.dueSoon && !task.removed;
    }

    const matchesSearch = task.title
      .toLowerCase()
      .includes(query);

    return matchesView && matchesSearch;
  });

  if (visibleTasks.length === 0) {
    const message = document.createElement("p");
    message.textContent = "No tasks to display.";
    taskList.appendChild(message);
    return;
  }

  visibleTasks.forEach(function (task) {
    const card = document.createElement("div");
    card.className = "task-card";

    if (task.completed) {
      card.classList.add("completed");
    }

    // Checkbox
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", "Mark task complete");
    checkbox.dataset.taskId = task.id;

    // Task title button opens its action menu
    const titleButton = document.createElement("button");
    titleButton.type = "button";
    titleButton.className = "task-title";
    titleButton.textContent = task.title;
    titleButton.dataset.menuToggle = task.id;

    if (task.completed) {
      titleButton.classList.add("completed-title");
    }

    // Each task gets its own hidden menu
    const menu = document.createElement("div");
    menu.className = "task-menu";
    menu.hidden = true;

    const actions = [
      {
        action: "important",
        label: task.important
          ? "Remove from Important"
          : "Mark as Important"
      },
      {
        action: "due-soon",
        label: task.dueSoon
          ? "Remove from Due Soon"
          : "Mark as Due Soon"
      },
      {
        action: "remove",
        label: "Remove task"
      }
    ];

    actions.forEach(function (item) {
      const actionButton = document.createElement("button");
      actionButton.type = "button";
      actionButton.textContent = item.label;
      actionButton.dataset.action = item.action;
      actionButton.dataset.taskId = task.id;
      menu.appendChild(actionButton);
    });

    card.append(checkbox, titleButton, menu);
    taskList.appendChild(card);
  });
}

// Handle checkbox clicks and task-menu actions
taskList.addEventListener("click", function (event) {
  const checkbox = event.target.closest(
    'input[type="checkbox"][data-task-id]'
  );

  if (checkbox) {
    const task = tasks.find(function (item) {
      return item.id === checkbox.dataset.taskId;
    });

    if (task) {
      task.completed = checkbox.checked;
      saveTasks();
      renderTasks();
    }

    return;
  }

  const actionButton = event.target.closest("button[data-action]");

  if (actionButton) {
    const task = tasks.find(function (item) {
      return item.id === actionButton.dataset.taskId;
    });

    if (!task) return;

    if (actionButton.dataset.action === "important") {
      task.important = !task.important;
    } else if (actionButton.dataset.action === "due-soon") {
      task.dueSoon = !task.dueSoon;
    } else if (actionButton.dataset.action === "remove") {
      task.removed = true;
    }

    saveTasks();
    renderTasks();
    return;
  }

  const menuToggle = event.target.closest("button[data-menu-toggle]");

  if (menuToggle) {
    const card = menuToggle.closest(".task-card");
    const menu = card.querySelector(".task-menu");

    menu.hidden = !menu.hidden;
  }
});

// Search as the user types
searchInput.addEventListener("input", renderTasks);

// Initialise the application
loadTasks();
renderTasks();
