document.addEventListener("DOMContentLoaded", function () {
  const skills = document.querySelectorAll('.skill');

  function revealSkills() {
    skills.forEach((skill, index) => {
      setTimeout(() => {
        skill.style.opacity = 1;
        skill.style.transform = 'scale(1)';
      }, index * 200);  // Delayed animation for each skill
    });
  }

  // Trigger skills reveal when section is visible
  const skillsSection = document.getElementById('skills');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        revealSkills();
      }
    });
  }, { threshold: 0.5 });

  observer.observe(skillsSection);
});
