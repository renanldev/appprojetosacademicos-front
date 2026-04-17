const API_URL = 'https://app-pet-aulacoding-backend.onrender.com/api/projects';

const form = document.getElementById('project-form');
const projectId = document.getElementById('project-id');
const title = document.getElementById('title');
const description = document.getElementById('description');
const technologies = document.getElementById('technologies');
const softSkills = document.getElementById('softSkills');
const professor = document.getElementById('professor');
const semester = document.getElementById('semester');
const teamMembers = document.getElementById('teamMembers');
const projectsList = document.getElementById('projects-list');
const message = document.getElementById('message');
const cancelEdit = document.getElementById('cancel-edit');
const formTitle = document.getElementById('form-title');
const reloadBtn = document.getElementById('reload-btn');

function showMessage(text) {
  message.textContent = text;
}

function clearForm() {
  form.reset();
  projectId.value = '';
  formTitle.textContent = 'Novo projeto';
  cancelEdit.classList.add('hidden');
}

function parseList(value) {
  return value
    .split(',')
    .map(item => item.trim())
    .filter(item => item);
}

function parseTeamMembers(value) {
  return value
    .split('\n')
    .map(line => line.trim())
    .filter(line => line)
    .map(line => {
      const parts = line.split('-');
      return {
        name: (parts[0] || '').trim(),
        role: (parts[1] || '').trim()
      };
    })
    .filter(member => member.name && member.role);
}

function teamMembersToText(members) {
  return members.map(member => `${member.name} - ${member.role}`).join('\n');
}

function renderTags(items) {
  return items.map(item => `<span class="tag">${item}</span>`).join('');
}

function renderTeamMembers(members) {
  return members
    .map(member => `<li><strong>${member.name}</strong> — ${member.role}</li>`)
    .join('');
}

async function loadProjects() {
  const response = await fetch(API_URL);
  const projects = await response.json();

  if (!projects.length) {
    projectsList.innerHTML = '<p>Nenhum projeto encontrado.</p>';
    return;
  }

  projectsList.innerHTML = projects.map(project => `
    <div class="entry-item">
      <h3>${project.title}</h3>
      <p>${project.description}</p>
      <p><strong>Professor:</strong> ${project.professor}</p>
      <p><strong>Período:</strong> ${project.semester}</p>

      <div class="section-group">
        <h4>Tecnologias</h4>
        <div class="tags">${renderTags(project.technologies || [])}</div>
      </div>

      <div class="section-group">
        <h4>Soft skills</h4>
        <div class="tags">${renderTags(project.softSkills || [])}</div>
      </div>

      <div class="section-group">
        <h4>Integrantes</h4>
        <ul class="member-list">${renderTeamMembers(project.teamMembers || [])}</ul>
      </div>

      <div class="entry-buttons">
        <button onclick="editProject('${project._id}')">Editar</button>
        <button onclick="deleteProject('${project._id}')">Excluir</button>
      </div>
    </div>
  `).join('');
}

async function saveProject(data) {
  const id = projectId.value;
  const url = id ? `${API_URL}/${id}` : API_URL;
  const method = id ? 'PUT' : 'POST';

  await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

window.editProject = async function (id) {
  const response = await fetch(`${API_URL}/${id}`);
  const project = await response.json();

  projectId.value = project._id;
  title.value = project.title || '';
  description.value = project.description || '';
  technologies.value = (project.technologies || []).join(', ');
  softSkills.value = (project.softSkills || []).join(', ');
  professor.value = project.professor || '';
  semester.value = project.semester || '';
  teamMembers.value = teamMembersToText(project.teamMembers || []);

  formTitle.textContent = 'Editar projeto';
  cancelEdit.classList.remove('hidden');
  showMessage('Editando projeto.');
};

window.deleteProject = async function (id) {
  if (!confirm('Deseja excluir este projeto?')) return;

  await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  showMessage('Projeto excluído.');
  loadProjects();
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    title: title.value.trim(),
    description: description.value.trim(),
    technologies: parseList(technologies.value),
    softSkills: parseList(softSkills.value),
    professor: professor.value.trim(),
    semester: semester.value.trim(),
    teamMembers: parseTeamMembers(teamMembers.value)
  };

  await saveProject(data);
  showMessage(projectId.value ? 'Projeto atualizado.' : 'Projeto criado.');
  clearForm();
  loadProjects();
});

cancelEdit.addEventListener('click', () => {
  clearForm();
  showMessage('Edição cancelada.');
});

reloadBtn.addEventListener('click', loadProjects);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register('./service-worker.js');
      console.log('Service Worker registrado com sucesso.');
    } catch (error) {
      console.log('Erro ao registrar Service Worker:', error);
    }
  });
}

clearForm();
loadProjects();