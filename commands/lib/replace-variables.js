export default (subject, variables) => {
    for (const varName in variables) {
        subject = subject.replace('$' + varName + '$', variables[varName]);
    }
    return subject
}