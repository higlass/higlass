/**
 * Get the cluster property accessor for a given property
 * @param   {string}  prop  Property type of [size, importance, clusterSize]
 * @return  {function}  Property accessor function.
 */
const getClusterPropAcc = (prop) => {
  // Default is the remote size
  let clusterPropAcc = cluster => cluster.members
    .reduce((total, member) => Math.max(
      member.maxXDataProj - member.minXDataProj,
      member.maxYDataProj - member.minYDataProj
    ), 0) / cluster.members.size;

  switch (prop) {
    case 'importance':
      clusterPropAcc = cluster => cluster.members
        .reduce(
          (total, member) => total + member.importance, 0
        ) / cluster.members.size;
      break;

    case 'clusterSize':
      clusterPropAcc = cluster => cluster.size;
      break;

    default:
      // Nothing. Already set.
  }

  return clusterPropAcc;
};

export default getClusterPropAcc;
