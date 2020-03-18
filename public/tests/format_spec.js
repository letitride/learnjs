var formattedProblems = [];
learnjs.problems.forEach(function(problem){
  formattedProblems.push({
    code: learnjs.formatCode(problem.code),
    name: problems.name
  });
});
return formattedProblems;