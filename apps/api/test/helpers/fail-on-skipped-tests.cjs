module.exports = (results) => {
  const skippedTests = (results.numPendingTests ?? 0) + (results.numTodoTests ?? 0);

  if (skippedTests === 0) return results;

  const affectedSuites = results.testResults
    .filter((suite) => (suite.numPendingTests ?? 0) + (suite.numTodoTests ?? 0) > 0)
    .map((suite) => suite.testFilePath)
    .join(', ');

  throw new Error(
    `A regressão não aceita testes ignorados ou pendentes: ${skippedTests}. Suítes: ${affectedSuites}`,
  );
};
